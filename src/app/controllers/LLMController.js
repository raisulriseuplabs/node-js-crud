import prisma from '../models/prismaClient.js';
import axios from 'axios';
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

const removeFile = (filePath) => {
  if (filePath) {
      fs.unlink(filePath, (err) => {
          if (err) console.error('Error removing file:', err);
      });
  }
};

const convertImageToBase64URL = (imagePath) => {
  const imageBuffer = fs.readFileSync(imagePath);
  return `data:image/png;base64,${imageBuffer.toString('base64')}`;
};

const generatePrompt = (query) => {
   const systemPrompt = `You are a professional fashion and textile image generation assistant.
    Your task is to create ultra-realistic outfit mockups that look like real studio product photos.
    Rules:
    1. The garment should always maintain natural folds, shadows, and lighting consistency.
    2. Apply the "color_html_code" and "fabric" realistically.
    3. Overlay "[print_image]" in the correct scale and position.
    4. Add the "[logo_image]" on the correct chest area per "logo_placement".
    5. The result must NOT look cartoonish, painted, or AI-generated.
    6. Output a clean, eCommerce-ready garment photo with a neutral background.
    `;

    const promptParts = ['Generate a high-quality, photorealistic clothing mockup image.'];
    if (query.base_image) promptParts.push(`Use first image as the base outfit image.`);
    if (query.fabric) promptParts.push(`Apply fabric texture: ${query.fabric}.`);
    if (query.color_html_code) promptParts.push(`Set the main garment color to: ${query.color_html_code}.`);
    if (query.print_image && query.print_file_scale_preset)
      promptParts.push(`Overlay the second image as print design (${query.print_file_scale_preset} scale) on the front.`);
    if (query.logo_image && query.logo_placement)
      promptParts.push(`Place the third image as logo on the ${query.logo_placement} chest area.`);
    if (query.description) promptParts.push(`Design description: ${query.description}.`);
    if (query.render_size)
      promptParts.push(
        `Render size: ${query.render_size}. Use realistic lighting, true fabric texture, and professional fashion photography style.`
      );

    const userPrompt = [
          { 
            type: "input_text", 
            text: promptParts.join(" ") 
          },
          {
            type: "input_image",
            image_url: query.base_image
          },
          query.print_image ? {
            type: "input_image",
            image_url: query.print_image
          } : null,
          query.logo_image ? {
            type: "input_image",
            image_url: query.logo_image
          } : null,

    ].filter(Boolean);
    return {
      'systemPrompt': systemPrompt,
      'userPrompt': userPrompt
    };
};

const requestToOpenAI = async (query) => {
  try {
    const prompt = generatePrompt(query);
    const openai = new OpenAI();
    const response = await openai.responses.create({
      model: "gpt-4.1",
      input: [
        {
          role: "system",
          content: prompt.systemPrompt,
        },
        {
          role: "user",
          content: prompt.userPrompt,
        },
      ],
      tools: [{ type: "image_generation" }],
    });
    const imageData = response.output
        .filter((output) => output.type === "image_generation_call")
        .map((output) => output.result);
    if (imageData.length > 0) {
      const imageBase64 = imageData[0];
      const generatedImage = `contents/generated/gen_${Date.now()}.png`;
      fs.writeFileSync(generatedImage, Buffer.from(imageBase64, "base64"));
      return `${process.env.APP_URL}/${generatedImage}`;
    } else {
      console.log(response.output.content);
      return response.output.content;
    }
  } catch (error) {
    console.error("❌ Error generating outfit image:", error);
    return {
      error: error.message,
    };
  }
};

const LLMController = {
  async gen(req, res) {
    const imageFile = req.files && req.files.image && req.files.image[0];
    if (!imageFile) {
        return res.status(400).json({ error: 'No file uploaded or invalid file type/size' });
    }
    const logoFile = req.files && req.files.logo && req.files.logo[0];
    try {
      const { description, color_html_code, fabric, print_file_code, print_file_scale_preset, logo_placement, render_size } = req.body;
      const query = {};

      if(description) query.description = description;
      if(color_html_code) query.color_html_code = color_html_code;
      if(fabric) query.fabric = fabric;
      if(render_size) query.render_size = render_size;
      
      if(print_file_code){
        const print = await prisma.print.findUnique({ where: { code: print_file_code } });
        if (!print) {
          removeFile(imageFile.path);
          removeFile(logoFile.path);
          return res.status(400).json({ error: 'Invalid print file code' });
        }
        const localImagePath = path.join(process.cwd(), 'contents/prints', print.image);
        query.print_image = convertImageToBase64URL(localImagePath);
        if(print_file_scale_preset) query.print_file_scale_preset = print_file_scale_preset;
      }

      if(logoFile) {
        const logoFileName = logoFile.filename;
        query.logo_image = convertImageToBase64URL(logoFile.path);
        if(logo_placement) query.logo_placement = logo_placement;
      }
      
      const imageFileName = imageFile.filename;
      query.base_image = convertImageToBase64URL(imageFile.path);

      const response = await requestToOpenAI(query);

      //TODO: Save the generated image to the database

      res.status(200).json({ message: `Generated response`, data: response });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: err.message || 'Internal server error' });
      removeFile(imageFile.path);
      removeFile(logoFile.path);
    }
  },

};



export default LLMController;


