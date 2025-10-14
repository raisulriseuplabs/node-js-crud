import prisma from '../models/prismaClient.js';
import bcrypt from 'bcrypt';

const EmployeeController = {

    async uploadAvatar(req, res) {
        try {
            const id = parseInt(req.params.id);
            const employee = await prisma.employee.findUnique({ where: { id } });
            if (!employee) return res.status(404).json({ error: 'Employee not found' });
            const avatarFile = req.files && req.files.avatar && req.files.avatar[0];
            if (!avatarFile) {
                return res.status(400).json({ error: 'No file uploaded or invalid file type/size' });
            }
            const avatarFileName = avatarFile.filename;
            const avatarPath = `${req.protocol}://${req.get('host')}/uploads/${avatarFileName}`;
            await prisma.employee.update({
                where: { id },
                data: { avatar: avatarFileName }
            });
            res.json({ message: 'Avatar uploaded', fileName: avatarFileName, filePath: avatarPath });
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message || 'Internal server error' });
        }
    },

    async create(req, res) {
        try {
            const { name, email, designation, password } = req.body;
            if (!name) return res.status(400).json({ error: 'Name is required' });
            if (!email) return res.status(400).json({ error: 'Email is required' });
            if (!designation) return res.status(400).json({ error: 'Designation is required' });
            if (!password) return res.status(400).json({ error: 'Password is required' });
            if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
            const hashedPassword = await bcrypt.hash(password, 12);
            const employee = await prisma.employee.create({ data: { name, email, designation, password: hashedPassword } });
            delete employee.password;
            res.status(201).json(employee);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message || 'Internal server error' });
        }
    },

    async index(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const pageSize = parseInt(req.query.pageSize) || 20;
            const skip = (page - 1) * pageSize;
            const [items, total] = await Promise.all([
                prisma.employee.findMany({ 
                    skip, 
                    take: pageSize, 
                    orderBy: { createdAt: 'desc' }, 
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        designation: true,
                        status: true
                    } 
                }),
                prisma.employee.count()
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
            const employee = await prisma.employee.findUnique({ where: { id } });
            if (!employee) return res.status(404).json({ error: 'Employee not found' });
            delete employee.password;
            res.json(employee);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async update(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { name, email, designation, status } = req.body;
            let password = req.body.password;
            const existing = await prisma.employee.findUnique({ where: { id } });
            if (!existing) return res.status(404).json({ error: 'Employee not found' });
            if (password) {
                password = password.trim();
                if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
                password = await bcrypt.hash(password, 12);
            }
            const employee = await prisma.employee.update({
                where: { id },
                data: {
                    name: name !== undefined ? name : existing.name,
                    email: email !== undefined ? email : existing.email,
                    designation: designation !== undefined ? designation : existing.designation,
                    status: status !== undefined ? status : existing.status,
                    password: password !== undefined ? password : existing.password,
                }
            });
            res.json(employee);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async patch(req, res) {
        try {
            const id = parseInt(req.params.id);
            const { name, email, designation, status } = req.body;
            let password = req.body.password;
            const existing = await prisma.employee.findUnique({ where: { id } });
            if (!existing) return res.status(404).json({ error: 'Employee not found' });
            if (password) {
                password = password.trim();
                if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
                password = await bcrypt.hash(password, 12);
            }
            const employee = await prisma.employee.update({
                where: { id },
                data: {
                    name: name !== undefined ? name : existing.name,
                    email: email !== undefined ? email : existing.email,
                    designation: designation !== undefined ? designation : existing.designation,
                    status: status !== undefined ? status : existing.status,
                    password: password !== undefined ? password : existing.password,
                }
            });
            res.json(employee);
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    async destroy(req, res) {
        try {
            const id = parseInt(req.params.id);
            const existing = await prisma.employee.findUnique({ where: { id } });
            if (!existing) return res.status(404).json({ error: 'Employee not found' });
            await prisma.employee.delete({ where: { id } });
            res.status(204).end();
        } catch (err) {
            console.error(err);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
};

export default EmployeeController;