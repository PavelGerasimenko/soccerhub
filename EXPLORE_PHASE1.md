# Exploring Phase 1: Learn the Architecture

Now that everything is working, let's understand how it all fits together.

## 1. Architecture Overview (5 mins)

```
User Request
    ↓
Express Route (user.routes.ts)
    ↓
Request Validation (express-validator)
    ↓
Authentication Middleware (authMiddleware)
    ↓
Service Layer (user.service.ts)
    ├─ Business Logic
    ├─ Error Handling
    └─ Calls Repository
         ↓
Repository Layer (user.repository.ts)
    ├─ Database Queries
    ├─ SQL Execution
    └─ Data Mapping
         ↓
PostgreSQL Database
```

## 2. Understanding the Code Flow (15 mins)

### Follow a User Registration Request

**File: `src/modules/users/user.routes.ts`** (Lines 1-50)
```typescript
POST /api/v1/auth/register
  ├─ Validates input (email, password, name)
  ├─ Calls UserService.registerUser()
  └─ Returns user + tokens
```

**File: `src/modules/users/user.service.ts`** (Lines 10-35)
```typescript
registerUser(data)
  ├─ Checks if email exists
  ├─ Calls UserRepository.createUser()
  ├─ Generates JWT tokens
  └─ Returns AuthResponse
```

**File: `src/modules/users/user.repository.ts`** (Lines 10-40)
```typescript
createUser(email, password, ...)
  ├─ Hashes password with bcrypt
  ├─ Generates UUID
  ├─ Executes SQL INSERT
  └─ Returns User object
```

**File: `src/database/schema.sql`**
```sql
INSERT INTO users.users (id, email, password_hash, ...)
VALUES ($1, $2, $3, ...)
```

### Try It Yourself

1. **Open file**: `src/modules/users/user.service.ts`
2. **Read lines 10-45**: See the registerUser function
3. **Find**: Where does it call UserRepository?
4. **Find**: Where are tokens generated?
5. **Find**: Where is password hashed?

## 3. Test-Driven Learning (15 mins)

Tests show exactly what should happen. Read them in order:

**File: `src/modules/users/user.service.test.ts`**
1. Lines 20-40: "registerUser should register a new user"
   - Shows the happy path
   - Shows what data is returned
   
2. Lines 42-50: "should throw ConflictError if email exists"
   - Shows error handling
   - Shows validation

3. Lines 52-65: "should normalize email to lowercase"
   - Shows business logic
   - Shows why it matters

**Read a test, then find the implementation:**
```
Test → Service Code → Repository Code → Database
```

## 4. Key Patterns to Learn

### Pattern 1: Layered Architecture
```
Routes (API handlers)
    ↓ (call)
Services (business logic)
    ↓ (call)
Repositories (data access)
    ↓ (execute)
Database (persistence)
```

**Why?** Easy to test, change, and maintain.

### Pattern 2: Error Handling
```typescript
// src/utils/errors.ts
throw new ValidationError('Invalid input')  // 400
throw new UnauthorizedError('Not logged in') // 401
throw new NotFoundError('User not found')   // 404
throw new ConflictError('Email exists')     // 409
```

**Why?** Consistent error responses across all endpoints.

### Pattern 3: Middleware
```typescript
// src/middleware/auth.ts
authMiddleware  → Checks JWT token
handleValidationErrors → Validates request
errorHandler → Catches all errors
```

**Why?** Reusable, DRY code.

### Pattern 4: Type Safety
```typescript
// src/types/user.interface.ts
interface User { ... }
interface CreateUserRequest { ... }
interface AuthResponse { ... }
```

**Why?** Catch errors at compile time, IDE autocomplete.

## 5. Exploring Each Layer

### Routes Layer
**File**: `src/modules/users/user.routes.ts`
- What endpoints exist?
- What validation is applied?
- What middleware is used?
- How are errors returned?

**Questions to answer:**
- How many endpoints? (Answer: 5)
- What's the longest validation chain? (Answer: register - 7 validators)
- What middleware is used most? (Answer: authMiddleware)

### Service Layer
**File**: `src/modules/users/user.service.ts`
- What business logic lives here?
- How are errors thrown?
- What repository methods are called?

**Questions to answer:**
- How is email normalized? (Answer: toLowerCase())
- When is password hashing called? (Answer: In repository, not service)
- How many public methods? (Answer: 6)

### Repository Layer
**File**: `src/modules/users/user.repository.ts`
- What SQL queries exist?
- How is data mapped?
- What indexes are used?

**Questions to answer:**
- How is password hashed? (Answer: bcrypt in createUser)
- What columns are returned? (Answer: All except password_hash)
- How is soft delete implemented? (Answer: is_active = false)

### Database Layer
**File**: `src/database/schema.sql`
- What tables exist?
- What constraints are there?
- What indexes are created?

**Questions to answer:**
- How many tables? (Answer: 4)
- What's the primary key type? (Answer: UUID)
- What columns have indexes? (Answer: email, created_at, is_active)

## 6. Debugging: Follow the Data

### Example: Register a user

1. **Postman/curl sends:**
```json
{
  "email": "john@example.com",
  "password": "Password123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

2. **Route receives** (user.routes.ts:15)
```typescript
router.post('/auth/register', [...validation...], async (req, res, next) => {
  const result = await UserService.registerUser(req.body);
  // result = { user, accessToken, refreshToken }
  res.status(201).json({ success: true, data: result });
}
```

3. **Service processes** (user.service.ts:10)
```typescript
async registerUser(data: CreateUserRequest) {
  const normalizedEmail = data.email.toLowerCase();
  const emailExists = await UserRepository.emailExists(normalizedEmail);
  // Result: false
  
  const user = await UserRepository.createUser(normalizedEmail, ...);
  // Result: { id: 'uuid-123', email: 'john@example.com', ... }
  
  const accessToken = generateAccessToken(user.id, user.email);
  // Result: 'eyJhbGc...'
  
  return { user, accessToken, refreshToken };
}
```

4. **Repository executes** (user.repository.ts:10)
```typescript
async createUser(email, password, firstName, lastName, ...) {
  const hashedPassword = await hashPassword(password);
  // Input:  'Password123!'
  // Output: '$2b$12$...' (bcrypt hash)
  
  const result = await query(
    'INSERT INTO users.users (...) VALUES ($1, $2, ...)',
    [id, email, hashedPassword, firstName, lastName, ...]
  );
  
  return result.rows[0]; // { id, email, first_name, ... }
}
```

5. **Database stores**
```sql
INSERT INTO users.users (id, email, password_hash, first_name, last_name, ...)
VALUES ('uuid-123', 'john@example.com', '$2b$12$...', 'John', 'Doe', ...)
```

6. **Response sent back**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-123",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      ...
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

## 7. Code Reading Checklist

- [ ] Read `src/modules/users/user.routes.ts` - understand all 5 endpoints
- [ ] Read `src/modules/users/user.service.ts` - understand business logic
- [ ] Read `src/modules/users/user.repository.ts` - understand queries
- [ ] Read `src/database/schema.sql` - understand data model
- [ ] Read `src/middleware/auth.ts` - understand authentication
- [ ] Read `src/utils/errors.ts` - understand error types
- [ ] Read `src/utils/jwt.ts` - understand token generation
- [ ] Read `src/utils/password.ts` - understand password hashing

## 8. Try It Out: Make Changes

### Exercise 1: Add a new field to user profile
1. Add column to schema: `src/database/schema.sql`
2. Update interface: `src/types/user.interface.ts`
3. Update repository: `src/modules/users/user.repository.ts`
4. Update service: `src/modules/users/user.service.ts`
5. Update routes: `src/modules/users/user.routes.ts`
6. Add tests: `src/modules/users/user.*.test.ts`
7. Run: `npm test`

### Exercise 2: Add validation to email
1. Make email unique (already done ✓)
2. Add regex validation
3. Test it with curl

### Exercise 3: Add password strength check
1. Update validatePassword in utils
2. Add to service
3. Test with weak password

## 9. Quick Reference

### Most Important Files
```
User Registration Flow:
1. src/modules/users/user.routes.ts       (API endpoint)
2. src/modules/users/user.service.ts      (Business logic)
3. src/modules/users/user.repository.ts   (Database)
4. src/database/schema.sql                (Schema)

Supporting:
5. src/middleware/auth.ts                 (Authentication)
6. src/utils/jwt.ts                       (Tokens)
7. src/utils/password.ts                  (Hashing)
```

### File Size Reference
```
user.routes.ts:       ~190 lines (API handlers)
user.service.ts:      ~65 lines (Business logic)
user.repository.ts:   ~105 lines (Database)
user.routes.test.ts:  ~230 lines (Route tests)
user.service.test.ts: ~185 lines (Service tests)
```

## 10. Questions to Answer

1. **How is password stored?** (Answer: Hashed with bcrypt in DB, never returned)
2. **How is authentication done?** (Answer: JWT tokens in Authorization header)
3. **How are errors handled?** (Answer: Custom error classes, caught by middleware)
4. **How is email validated?** (Answer: exists() check + format validation)
5. **How are tokens generated?** (Answer: jwt.sign() with secret)
6. **How is data mapped?** (Answer: SQL returns objects, TypeScript types them)
7. **How are tests organized?** (Answer: One test file per module, mocked dependencies)

---

## Next Steps

After exploring:
1. **Modify a feature** to test your understanding
2. **Add a new endpoint** using same patterns
3. **Start Phase 2** with Event Management

Ready to move forward? 🚀
