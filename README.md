# WorkZen HRMS - Backend API

A comprehensive Human Resource Management System backend built with Node.js, Express, TypeScript, and PostgreSQL.

## 🚀 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (Access + Refresh tokens)
- **Password Hashing**: bcrypt
- **Validation**: Zod
- **Containerization**: Docker + Docker Compose

## 📁 Project Structure

```
workzen-hrms/
├── src/
│   ├── config/          # Configuration files
│   ├── database/         # Database setup
│   ├── modules/          # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── users/       # User management
│   │   ├── attendance/  # Attendance tracking
│   │   ├── leave/       # Leave management
│   │   ├── payroll/     # Payroll management
│   │   └── dashboard/   # Dashboard APIs
│   ├── middlewares/     # Express middlewares
│   ├── utils/           # Utility functions
│   ├── routes/          # Route definitions
│   ├── app.ts           # Express app setup
│   └── server.ts        # Server entry point
├── prisma/
│   ├── schema.prisma    # Database schema
│   └── seed.ts          # Seed script
├── docker-compose.yml   # Docker services
├── Dockerfile          # Docker image
└── .env.example        # Environment variables template
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js (v20 or higher)
- Docker and Docker Compose
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd hrms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the values as needed.

4. **Start Docker services**
   ```bash
   docker-compose up -d
   ```

5. **Run Prisma migrations**
   ```bash
   npm run prisma:migrate
   ```

6. **Generate Prisma Client**
   ```bash
   npm run prisma:generate
   ```

7. **Seed the database**
   ```bash
   npm run prisma:seed
   ```

8. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:5432`

## 📊 Database Access

- **PostgreSQL**: `localhost:5432`
- **Adminer**: `http://localhost:8080`
  - System: PostgreSQL
  - Server: postgres
  - Username: workzen_user
  - Password: workzen_password
  - Database: workzen_db

## 🔐 Default Credentials

After seeding, you can use these credentials:

- **Admin**: `admin@workzen.com` / `Admin@123`
- **HR Officer**: `hr@workzen.com` / `HR@123`
- **Payroll Officer**: `payroll@workzen.com` / `Payroll@123`
- **Employee**: `employee@workzen.com` / `Employee@123`

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get current user profile

### Users
- `GET /api/users` - Get all users (Admin/HR)
- `GET /api/users/:userId` - Get user by ID
- `POST /api/users` - Create user (Admin)
- `PUT /api/users/:userId` - Update user
- `DELETE /api/users/:userId` - Delete user (Admin)

### Attendance
- `POST /api/attendance/check-in` - Mark check-in
- `POST /api/attendance/check-out` - Mark check-out
- `GET /api/attendance/daily` - Get daily attendance
- `GET /api/attendance/monthly/:userId?` - Get monthly logs
- `GET /api/attendance/summary/:userId?` - Get attendance summary
- `GET /api/attendance/all` - Get all employees attendance (HR/Admin)

### Leaves
- `POST /api/leaves/apply` - Apply for leave
- `GET /api/leaves/user/:userId?` - Get user's leaves
- `GET /api/leaves/pending` - Get pending leaves (Payroll/Admin)
- `GET /api/leaves/:leaveId` - Get leave by ID
- `PATCH /api/leaves/:leaveId/status` - Approve/reject leave (Payroll/Admin)
- `GET /api/leaves/summary/:userId?` - Get leave summary
- `GET /api/leaves/history` - Get leave history (HR/Admin)

### Payroll
- `POST /api/payroll/generate` - Generate payroll (Payroll/Admin)
- `GET /api/payroll/all` - Get all payrolls (Payroll/Admin)
- `GET /api/payroll/user/:userId?` - Get user's payrolls
- `GET /api/payroll/user/:userId?/month` - Get payroll by month
- `GET /api/payroll/:payrollId` - Get payroll by ID
- `GET /api/payroll/summary` - Get payroll summary (Payroll/Admin)

### Dashboard
- `GET /api/dashboard/attendance` - Attendance summary
- `GET /api/dashboard/leaves` - Leaves summary
- `GET /api/dashboard/payroll` - Payroll summary
- `GET /api/dashboard/employee/:userId?` - Employee dashboard
- `GET /api/dashboard/organization` - Organization metrics (HR/Admin)

## 🔒 Role-Based Access Control

### Admin
- Full access to all modules
- Can manage users and roles
- Can access all data

### HR Officer
- Manage employee profiles
- Monitor attendance
- Allocate leaves
- Cannot access payroll

### Payroll Officer
- Approve/reject leaves
- Generate payslips
- Manage salary information
- Access attendance data
- Cannot modify user data

### Employee
- Apply for leave
- View own attendance
- View own payroll
- View own performance
- Cannot access other employees' data

## 💰 Salary Calculation

- **PF**: 12% of basic salary
- **Professional Tax**: ₹200 (fixed)
- **Net Pay**: Basic + HRA + Allowances - Deductions

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild containers
docker-compose up -d --build
```

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run migrations
- `npm run prisma:seed` - Seed database
- `npm run prisma:studio` - Open Prisma Studio

## 🧪 Testing

API endpoints can be tested using tools like:
- Postman
- Insomnia
- Thunder Client (VS Code extension)

## 📄 License

ISC

## 👥 Support

For issues and questions, please contact the development team.

