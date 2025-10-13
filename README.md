# Todo API (Express + Prisma + MySQL)

Simple RESTful Todo CRUD API built with Node.js, Express, Prisma ORM, and MySQL.

## Features

- Create, Read, Update (PUT/PATCH), Delete Todos
- Pagination for list endpoint (`/todos?page=1&pageSize=20`)
- Prisma as ORM (schema in `prisma/schema.prisma`)
- Nodemon for development

## Requirements

- Node.js 18+
- MySQL 8+

## Setup

```bash
cp .env.example .env
# Edit .env with your MySQL credentials
npm install
npx prisma migrate dev --name init
npm run dev
```

## API Endpoints

| Method | Path       | Description                                                      |
| ------ | ---------- | ---------------------------------------------------------------- |
| GET    | /health    | Health check                                                     |
| POST   | /todos     | Create todo (body: { title, description? })                      |
| GET    | /todos     | List todos (query: page, pageSize)                               |
| GET    | /todos/:id | Get single todo                                                  |
| PUT    | /todos/:id | Replace/Update todo (body: { title, description, completed })    |
| PATCH  | /todos/:id | Partial update (any subset of { title, description, completed }) |
| DELETE | /todos/:id | Delete todo                                                      |

## Example Create Todo

```bash
curl -X POST http://localhost:3000/todos \
  -H 'Content-Type: application/json' \
  -d '{"title": "Buy milk", "description": "2% organic"}'
```

## License

MIT
