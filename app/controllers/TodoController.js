import prisma from '../models/prismaClient.js';

const TodoController = {
  async create(req, res) {
    try {
      const { title, description } = req.body;
      if (!title) return res.status(400).json({ error: 'Title is required' });
      const todo = await prisma.todo.create({ data: { title, description } });
      res.status(201).json(todo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async index(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;
      const skip = (page - 1) * pageSize;
      const [items, total] = await Promise.all([
        prisma.todo.findMany({ skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
        prisma.todo.count()
      ]);
      res.json({ page, pageSize, total, items });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async show(req, res) {
    try {
      const id = parseInt(req.params.id);
      const todo = await prisma.todo.findUnique({ where: { id } });
      if (!todo) return res.status(404).json({ error: 'Todo not found' });
      res.json(todo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async update(req, res) {
    try {
      const id = parseInt(req.params.id);
      const { title, description, completed } = req.body;
      const existing = await prisma.todo.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Todo not found' });
      const todo = await prisma.todo.update({
        where: { id },
        data: {
          title: title !== undefined ? title : existing.title,
          description: description !== undefined ? description : existing.description,
          completed: completed !== undefined ? completed : existing.completed,
        }
      });
      res.json(todo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async patch(req, res) {
    try {
      const id = parseInt(req.params.id);
      const data = req.body;
      const existing = await prisma.todo.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Todo not found' });
      const allowed = ['title', 'description', 'completed'];
      const updateData = {};
      for (const key of allowed) {
        if (key in data) updateData[key] = data[key];
      }
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ error: 'No valid fields to update' });
      }
      const todo = await prisma.todo.update({ where: { id }, data: updateData });
      res.json(todo);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  },

  async destroy(req, res) {
    try {
      const id = parseInt(req.params.id);
      const existing = await prisma.todo.findUnique({ where: { id } });
      if (!existing) return res.status(404).json({ error: 'Todo not found' });
      await prisma.todo.delete({ where: { id } });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
};

export default TodoController;
