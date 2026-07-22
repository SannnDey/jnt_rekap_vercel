# 💡 Development Tips & Best Practices

## Code Structure

### Backend (Express + Prisma + TypeScript)

**File Organization**:
```
src/
├── index.ts            # Entry point
├── controllers/        # Business logic
├── routes/             # API endpoints
├── schemas/            # Zod validation
└── middleware/         # Custom middleware
```

**Controller Pattern**:
```typescript
// controllers/example.controller.ts
export const getExample = async (req: Request, res: Response) => {
  try {
    const data = await prisma.model.findMany();
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error' });
  }
};
```

**Validation Pattern**:
```typescript
// Always validate input
const validatedData = SomeSchema.parse(req.body);

// For optional fields, use .partial()
const UpdateSchema = CreateSchema.partial();
```

### Frontend (Next.js 14 + React Query)

**Component Structure**:
```
components/
├── Header.tsx          # Header component
├── RekapanTable.tsx    # Table with data
└── RekapanForm.tsx     # Form for create/edit
```

**Hook Pattern**:
```typescript
// hooks/useRekapan.ts
export const useRekapanList = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['rekapan', page, limit],
    queryFn: () => apiClient.getRekapanList(page, limit),
  });
};
```

**Component with Hooks**:
```typescript
'use client'; // For client-side rendering in Next.js 14

export default function MyComponent() {
  const { data, isLoading, error } = useRekapanList();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return <div>{data?.data.map(...)}</div>;
}
```

## Database Migrations

### Add New Column

1. **Update Schema**:
```prisma
model RekapanOutgoing {
  // ... existing fields
  newField   String // Add new field
}
```

2. **Create Migration**:
```bash
cd backend
npm run prisma:migrate
# Enter migration name: "add_new_field"
```

3. **Update Types & Schemas**:
```typescript
// types/index.ts
interface RekapanOutgoing {
  newField: string;
}

// schemas/rekapan.schema.ts
CreateRekapanOutgoingSchema.extend({
  newField: z.string(),
});
```

4. **Update Controllers & Frontend**

### Rollback Migration

```bash
# Prisma migrations are permanent (by design)
# To revert, you need to create a new migration

# Option 1: Reset database (dev only!)
npm run prisma:reset

# Option 2: Manually adjust schema and create new migration
```

## API Development

### Add New Endpoint

1. **Create Controller**:
```typescript
// src/controllers/new.controller.ts
export const newAction = async (req: Request, res: Response) => {
  try {
    // Validate
    const data = NewSchema.parse(req.body);
    
    // Process
    const result = await prisma.model.create({ data });
    
    // Respond
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    handleError(error, res);
  }
};
```

2. **Add Route**:
```typescript
// src/routes/new.routes.ts
router.post('/', newAction);
router.get('/', getAllNew);
```

3. **Register Route in App**:
```typescript
// src/index.ts
app.use('/api/new', newRoutes);
```

4. **Update Frontend API Client**:
```typescript
// lib/api.ts
async newAction(data: NewInput) {
  const response = await this.client.post('/new', data);
  return response.data;
}
```

## Frontend Development

### Add New Page

1. **Create Page File**:
```typescript
// app/new-page/page.tsx
'use client';

export default function NewPage() {
  return <div>New Page Content</div>;
}
```

2. **Create Corresponding Component**:
```typescript
// components/NewPageComponent.tsx
'use client';

export default function NewPageComponent() {
  const { data } = useNewHook();
  return <div>{/* content */}</div>;
}
```

### Add New Hook

```typescript
// hooks/useNewFeature.ts
'use client';

export const useNewFeature = (param: string) => {
  return useQuery({
    queryKey: ['new-feature', param],
    queryFn: () => apiClient.getNewFeature(param),
  });
};
```

## Error Handling

### Backend

```typescript
// Centralized error handler
export const handleError = (error: unknown, res: Response) => {
  if (error instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.errors,
    });
  } else if (error instanceof PrismaClientKnownRequestError) {
    res.status(400).json({
      success: false,
      message: 'Database error',
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
```

### Frontend

```typescript
// Always handle loading & error states
export default function Component() {
  const { data, isLoading, error } = useQuery(...);
  
  if (isLoading) return <Skeleton />;
  if (error) return <ErrorBoundary error={error} />;
  
  return <Content data={data} />;
}
```

## Testing with Postman

1. **Import Collection**: `JNT-Rekap-API.postman_collection.json`
2. **Set Environment Variables**:
   - `base_url`: `http://localhost:3000`
   - `rekapan_id`: Copy ID from database

3. **Test Workflow**:
   - POST create new
   - GET to retrieve (copy ID)
   - PUT to update
   - DELETE to remove

## Performance Tips

### Backend
- ✅ Add indexes for frequently queried fields (done in schema)
- ✅ Use pagination for large datasets
- ✅ Cache frequently accessed data
- ✅ Use `.select()` in Prisma to fetch only needed fields

### Frontend
- ✅ Use React Query for automatic caching
- ✅ Lazy load images
- ✅ Code splitting per route
- ✅ Optimize bundle size

## Security Checklist

- ✅ Validate all input with Zod
- ✅ Use UUID for ID (not auto-increment)
- ✅ CORS configured properly
- ✅ No sensitive data in logs
- ✅ Environment variables for secrets
- ✅ Error messages don't expose internals

## Debugging

### Backend
```bash
# Add console.log (will show in terminal)
console.log('Debug:', variable);

# Use Prisma Studio to inspect database
npm run prisma:studio

# Enable SQL query logging in Prisma
# Add to .env:
DEBUG=prisma:*
```

### Frontend
```bash
# Browser DevTools (F12)
console.log('Debug:', data);

# React Query DevTools (auto-installed in dev)
// Shows all React Query states

# Next.js Debugging
# npm run dev with VS Code debugger
```

## Deployment Checklist

### Before Deploying

- [ ] All tests pass
- [ ] No console errors/warnings
- [ ] Environment variables set correctly
- [ ] Database migrated on production
- [ ] Error handling in place
- [ ] CORS properly configured
- [ ] Rate limiting configured
- [ ] Logging configured

### Deployment Steps

**Backend**:
```bash
npm run build
npm start
```

**Frontend**:
```bash
npm run build
npm start
# Or deploy to Vercel
vercel
```

## Common Issues & Solutions

### Issue: "Cannot find module"
```bash
# Solution: Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "UUID not valid"
```typescript
// Always validate UUID on backend
if (!isValidUUID(id)) {
  return res.status(400).json({ error: 'Invalid ID' });
}
```

### Issue: "CORS error"
```typescript
// Check backend CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}));
```

## Resources

- [Express.js Docs](https://expressjs.com/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [React Query Docs](https://tanstack.com/query/latest)
- [Zod Docs](https://zod.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

---

Happy Coding! 🚀
