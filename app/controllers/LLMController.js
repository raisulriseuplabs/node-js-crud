import prisma from '../models/prismaClient.js';
import axios from 'axios';
import OpenAI from "openai";
import fs from 'fs';
import path from 'path';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

const requestToOpenAI = async (query) => {
  try {
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
    if (query.base_image) promptParts.push(`Use this as the base outfit image: "[base_image]".`);
    if (query.fabric) promptParts.push(`Apply fabric texture: ${query.fabric}.`);
    if (query.color_html_code) promptParts.push(`Set the main garment color to: ${query.color_html_code}.`);
    if (query.print_image && query.print_file_scale_preset)
      promptParts.push(`Overlay this print design (${query.print_file_scale_preset} scale): "[print_image]".`);
    if (query.logo && query.logo_placement)
      promptParts.push(`Place the logo "[logo_image]" on the ${query.logo_placement} chest area.`);
    if (query.description) promptParts.push(`Design description: ${query.description}.`);
    if (query.render_size)
      promptParts.push(
        `Render size: ${query.render_size}. Use realistic lighting, true fabric texture, and professional fashion photography style.`
      );

    const prompt = promptParts.join(" ");

    const response = await openai.images.generate({
      model: "gpt-5",
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", contents: [
          { type: "text", text: prompt },
          { type: "input_image", base_image: query.base_image },
          query.print_image ? { type: "input_image", print_image: query.print_image } : null,
          query.logo_image ? { type: "input_image", logo_image: query.logo_image } : null,
        ] },
      ],
      response_format: "b64_json",
      size:
        query.render_size && query.render_size === "large"
          ? "2048x2048"
          : query.render_size === "small"
          ? "512x512"
          : "1024x1024",
      n: 1,
    });

    const image_base64 = response.data[0].b64_json;
    const buffer = Buffer.from(image_base64, "base64");
    const generatedImage = `contents/generated/gen_${Date.now()}.png`;
    fs.writeFileSync(generatedImage, buffer);

    return {
      generated_image: `${process.env.APP_URL}/contents/generated/${generatedImage.split("/").pop()}`,
    };
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


