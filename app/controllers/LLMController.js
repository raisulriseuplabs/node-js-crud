import prisma from '../models/prismaClient.js';
import axios from 'axios';
import OpenAI from "openai";
import fs from 'fs';

const openAIKey = process.env.OPENAI_API_KEY;

const client = new OpenAI(openAIKey);

const removeFile = (filePath) => {
  if (filePath) {
      fs.unlink(filePath, (err) => {
          if (err) console.error('Error removing file:', err);
      });
  }
};

const requestToOpenAI = async (query) => {
    const promptParts = ['Generate a high-quality clothing mockup image.'];
    if (query.image) promptParts.push(`Base outfit image: ${query.image}.`);
    if (query.fabric) promptParts.push(`Fabric: ${query.fabric}.`);
    if (query.color_html_code) promptParts.push(`Main color: ${query.color_html_code}.`);
    if (query.print_image && query.print_file_scale_preset) promptParts.push(`Overlay print design (scale: ${query.print_file_scale_preset}): ${query.print_image}.`);
    if (query.logo && query.logo_placement) promptParts.push(`Add logo: ${query.logo} on the ${query.logo_placement} chest area.`);
    if (query.description) promptParts.push(`Description: ${query.description}.`);
    if (query.render_size) promptParts.push(`Render in ${query.render_size} size with realistic lighting, fabric texture, and professional fashion photography style.`);

    const prompt = promptParts.join(' ');
    return prompt;
    try {
      const response = await client.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: prompt }]
      });
      return response;
    } catch (error) {
      console.error('Error communicating with OpenAI:', error);
      throw new Error('Failed to communicate with OpenAI');
    }
}

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
        query.print_image = `${req.protocol}://${req.get('host')}/contents/${print.image}`;
        if(print_file_scale_preset) query.print_file_scale_preset = print_file_scale_preset;
      }

      if(logoFile) {
        const logoFileName = logoFile.filename;
        query.logo = `${req.protocol}://${req.get('host')}/contents/${logoFileName}`;
        if(logo_placement) query.logo_placement = logo_placement;
      }
      
      const imageFileName = imageFile.filename;
      query.image = `${req.protocol}://${req.get('host')}/contents/${imageFileName}`;

      const response = await requestToOpenAI(query);

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


