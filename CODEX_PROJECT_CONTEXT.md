# &#x20;Project Overview

## Project name

**HRMS Backend**

Repository:

```
```

```
hrms-backend
```

The local project path used during development was:

```
```

```
C:\Users\Lenovo\OneDrive\Desktop\hrms-backend
```

## What the backend does

This is a **Human Resource Management System backend** currently focused on the employee-management foundation.

The implemented backend manages:

-  Departments 
-  Designations 
-  Employees 
-  Employee personal information 
-  Employee addresses 
-  Employee documents 
-  Employee-code generation 
-  Employee CRUD 
-  Document upload/retrieval/update/delete 

The broader HRMS documentation describes a complete employee lifecycle system including recruitment, attendance, leave, payroll, training, performance, ESS, reporting, and separation. 

However, those broader modules are **not currently implemented as backend APIs**.

## Main business purpose

The central business purpose is to maintain a structured employee master record and its associated:

```
```

```
Employee
 ├── Department
 ├── Designation
 ├── Personal Information
 ├── Current Address
 ├── Permanent Address
 └── Documents
```

The documentation explicitly describes Employee Management as the central/master record on which other HRMS modules depend. 

## Current development stage

**Backend CRUD + employee registration + document management completed and tested.**

The project has reached the point where the backend is being prepared for:

```
```

```
API audit
    ↓
Frontend integration
```

## Already working

Confirmed through Postman/pgAdmin/testing during the conversation:

-  Department CRUD 
-  Designation CRUD 
-  Employee GET all 
-  Employee GET by ID 
-  Employee POST 
-  Employee PUT 
-  Employee DELETE 
-  Employee document POST 
-  Employee document GET/list 
-  Individual document GET 
-  Document metadata PUT 
-  Document DELETE 
-  PostgreSQL persistence 
-  Employee-code generation 
-  Transactional employee registration 
-  Multipart file upload 
-  Binary document storage in PostgreSQL 
-  Required-document validation 
-  Education-path validation 
-  Document duplicate validation 

The final employee registration test successfully produced:

```
```

```
{
  "message": "Employee registered successfully",
  "employeeId": 49,
  "employeeCode": "HR-2026-0008"
}
```

and PostgreSQL was verified to contain the employee's seven uploaded document records.

## Currently being developed

The backend itself is no longer in the initial CRUD-building stage.

The next stage is:

**API audit → frontend/backend integration.**

## Immediate next objective

Before changing backend behavior:

1.  Audit the complete API contract. 
2.  Confirm frontend-required request/response formats. 
3.  Verify CORS/development communication. 
4.  Hand the API contract to the frontend developer. 
5.  Integrate the existing React frontend. 
6.  Test the complete frontend → backend → PostgreSQL flow. 

---

# 2. Technology Stack

## Confirmed/current

| AreaTechnologyStatus |                                           |                                                                |
| -------------------- | ----------------------------------------- | -------------------------------------------------------------- |
| Language             | TypeScript                                | Confirmed                                                      |
| Runtime              | Node.js                                   | Confirmed; exact project-supported version not formally pinned |
| Backend              | NestJS                                    | Confirmed                                                      |
| HTTP adapter         | Express                                   | Confirmed by `@nestjs/platform-express` and runtime logs       |
| Database             | PostgreSQL                                | Confirmed                                                      |
| DB driver            | `pg` / node-postgres                      | Confirmed                                                      |
| ORM                  | None                                      | Confirmed                                                      |
| Query builder        | None                                      | Confirmed                                                      |
| Database access      | Raw parameterized SQL through `DbService` | Confirmed                                                      |
| File upload          | Multer                                    | Confirmed                                                      |
| API style            | REST                                      | Confirmed                                                      |
| Authentication       | None                                      | Not implemented                                                |
| Authorization/RBAC   | None                                      | Not implemented                                                |
| DTO validation       | None                                      | Intentionally not being used                                   |
| Caching              | None                                      | Not implemented                                                |
| Queues               | None                                      | Not implemented                                                |
| Background jobs      | None                                      | Not implemented                                                |
| Object storage       | None                                      | Not implemented                                                |
| File storage         | PostgreSQL binary data                    | Confirmed                                                      |
| External APIs        | None                                      | Not implemented                                                |
| Testing framework    | UNKNOWN                                   | No automated test suite established in conversation            |
| Package manager      | npm                                       | Confirmed                                                      |
| Build tool           | Nest CLI / `nest build`                   | Confirmed                                                      |
| Docker               | UNKNOWN / not established                 | Not part of current workflow                                   |
| Deployment           | UNKNOWN                                   | Not established                                                |
| CI/CD                | UNKNOWN                                   | Not established                                                |

The backend context explicitly establishes NestJS, TypeScript, PostgreSQL, node-postgres, Multer and REST APIs, with direct SQL through a custom `DbService`. 

## Database access decision

We are **not using Prisma for the implemented employee CRUD**.

The current approach is:

```
```

```
Service
   ↓
DbService
   ↓
pg Pool
   ↓
PostgreSQL
```

`DbService` provides:

```
```

```
query(...)
getClient()
```

The employee registration transaction uses a `PoolClient`. 

## Planned

Not currently implemented:

-  Authentication 
-  JWT/session system 
-  RBAC 
-  Remaining HRMS modules 
-  Automated test suite 
-  Production deployment architecture 

## Discussed/rejected

### Prisma for current CRUD

Not used.

Reason: the project was intentionally built using PostgreSQL + `pg` + direct SQL to understand relational database operations and transactions.

### DTO validation

The user explicitly decided:

> "we don't need dto validation we will go without"

Therefore Codex must **not casually reintroduce DTO validation**.

This does not mean validation doesn't exist. Business validation is currently performed inside services and file-upload utilities.

---

# 3. Architecture

## Current architecture

```
```

```
HTTP Request
     ↓
NestJS Controller
     ↓
Service
     ↓
DbService
     ↓
PostgreSQL
```

For employee registration:

```
```

```
HTTP multipart/form-data
          ↓
EmployeeController
          ↓
Multer / FileFieldsInterceptor
          ↓
EmployeeService
          ↓
BEGIN TRANSACTION
          ↓
Validate department
          ↓
Validate designation
          ↓
Generate employee code
          ↓
Insert employee
          ↓
Insert personal information
          ↓
Insert current address
          ↓
Insert permanent address
          ↓
Validate documents
          ↓
Insert document binary data
          ↓
COMMIT
```

If anything fails:

```
```

```
ROLLBACK
   ↓
release PoolClient
```

The transaction flow was explicitly implemented because employee registration spans multiple related tables and must not leave partially-created employee data. 

---

## Major components

### `DbService`

Responsible for:

-  PostgreSQL connection pool 
-  simple SQL queries 
-  obtaining transaction clients 
-  connection lifecycle 

### Controllers

Responsible for:

-  HTTP routes 
-  extracting request parameters 
-  extracting request body 
-  handling multipart file fields 
-  passing data to services 

### Services

Responsible for:

-  business logic 
-  database queries 
-  validation 
-  transaction management 
-  error handling 

### Common upload utilities

Responsible for:

-  document field mapping 
-  document metadata validation 
-  duplicate document detection 
-  file handling helpers 

### Database

PostgreSQL stores:

-  employee records 
-  employee relationships 
-  personal information 
-  addresses 
-  binary document data 

---

# 4. Repository / Folder Structure

The exact current repository structure was not provided as a final recursive tree, so the following reflects the files confirmed during development. **Unlisted files must be verified in the actual repository rather than invented.**

```
```

```
hrms-backend/
├── src/
│   ├── common/
│   │   ├── document-upload.ts
│   │   ├── file-validation.ts
│   │   └── multer.config.ts
│   │
│   ├── db/
│   │   ├── db.module.ts
│   │   └── db.service.ts
│   │
│   ├── department/
│   │   ├── department.controller.ts
│   │   ├── department.service.ts
│   │   └── ...
│   │
│   ├── designation/
│   │   ├── designation.controller.ts
│   │   ├── designation.service.ts
│   │   └── ...
│   │
│   ├── employee/
│   │   ├── employee.controller.ts
│   │   ├── employee.service.ts
│   │   ├── employee.module.ts
│   │   ├── document.controller.ts
│   │   ├── document.service.ts
│   │   ├── constants/
│   │   │   └── document.constants.ts
│   │   └── ...
│   │
│   ├── app.module.ts
│   └── main.ts
│
├── package.json
├── package-lock.json
├── tsconfig.json
├── nest-cli.json
└── .env
```

### Removed

These development-only test files were intentionally removed:

```
```

```
src/employee/employee-test.controller.ts
src/employee/employee-test.service.ts
```

The employee module was changed to use:

```
```

```
EmployeeController
DocumentController
EmployeeService
DocumentService
```

instead. The recorded patch confirms this change. 

---

# 5. Database

## Database

```
```

```
PostgreSQL
```

Database name used during development:

```
```

```
hrms_db
```

The actual connection values are environment-driven.

---

## `departments`

### Purpose

Master table for organizational departments.

### Important fields

```
```

```
id
department_name
department_code
created_at
updated_at
```

### Primary key

```
```

```
id
```

### Unique

```
```

```
department_code
```

### Important constraint

```
```

```
department_name NOT NULL
department_code NOT NULL
```

The department code is particularly important because it participates in employee-code generation. 

---

## `designations`

### Purpose

Master table for employee designations.

### Important fields

```
```

```
id
designation_name
created_at
updated_at
```

### Primary key

```
```

```
id
```

### Unique

```
```

```
designation_name
```

### Important constraint

```
```

```
designation_name NOT NULL
```

---

## `employees`

### Purpose

Core employee master record.

### Fields

```
```

```
id
employee_code
first_name
last_name
email
phone
gender
dob
joining_date
department_id
designation_id
manager_id
employment_type
work_location
status
created_at
updated_at
```

### Primary key

```
```

```
id
```

### Unique

```
```

```
employee_code
email
phone
```

### Foreign keys

```
```

```
department_id → departments.id
designation_id → designations.id
manager_id → employees.id
```

The manager relationship is self-referential. 

---

## `employee_personal_info`

### Purpose

Stores additional employee personal/family/emergency information.

### Fields

```
```

```
id
employee_id
father_name
father_aadhaar_number
mother_name
mother_aadhaar_number
marital_status
nationality
blood_group
emergency_contact_name
emergency_contact_number
emergency_contact_relation
```

### Primary key

```
```

```
id
```

### Foreign key

```
```

```
employee_id → employees.id
```

### Unique

```
```

```
employee_id
```

This creates a one-to-one relationship between employee and personal information.

---

## `employee_addresses`

### Purpose

Stores current and permanent employee addresses.

### Fields

```
```

```
id
employee_id
address_type
house_no
street
city
state
pincode
country
```

### Primary key

```
```

```
id
```

### Foreign key

```
```

```
employee_id → employees.id
```

### Required

```
```

```
employee_id
address_type
house_no
street
city
state
pincode
country
```

Two records are created during employee registration:

```
```

```
Current
Permanent
```

If:

```
```

```
sameAsCurrentAddress = true
```

the permanent address is copied from the current address. 

---

## `employee_documents`

### Purpose

Stores employee documents and their binary contents.

### Fields

```
```

```
id
employee_id
document_name
document_type
original_file_name
mime_type
file_data
uploaded_at
```

### Primary key

```
```

```
id
```

### Foreign key

```
```

```
employee_id → employees.id
```

### Required

```
```

```
employee_id
document_name
document_type
original_file_name
mime_type
file_data
```

Files are stored directly as binary data in PostgreSQL. 

---

## Relationships

```
```

```
departments
     │
     │ 1:N
     ▼
employees
     │
     ├──────────────► designations
     │
     ├──────────────► employee_personal_info
     │                    1:1
     │
     ├──────────────► employee_addresses
     │                    1:N
     │
     ├──────────────► employee_documents
     │                    1:N
     │
     └──────────────► employees
                       manager_id
                       self-reference
```

---

## Verified constraints

The following constraint structure was explicitly retrieved from PostgreSQL:

### Departments

```
```

```
departments_pkey
departments_department_code_key
departments_department_code_not_null
departments_department_name_not_null
departments_id_not_null
```

### Designations

```
```

```
designations_pkey
designations_designation_name_key
designations_designation_name_not_null
designations_id_not_null
```

### Employees

```
```

```
employees_pkey
employees_email_key
employees_employee_code_key
employees_phone_key

employees_email_not_null
employees_employee_code_not_null
employees_first_name_not_null
employees_last_name_not_null
employees_phone_not_null
employees_gender_not_null
employees_dob_not_null
employees_joining_date_not_null
employees_employment_type_not_null
employees_id_not_null
```

Foreign keys:

```
```

```
employees_department_id_fkey
employees_designation_id_fkey
employees_manager_id_fkey
```

### Personal information

```
```

```
employee_personal_info_pkey
employee_personal_info_employee_id_key
employee_personal_info_employee_id_not_null
employee_personal_info_father_name_not_null
employee_personal_info_mother_name_not_null
employee_personal_info_marital_status_not_null
employee_personal_info_nationality_not_null
```

### Addresses

```
```

```
employee_addresses_pkey
employee_addresses_employee_id_not_null
employee_addresses_address_type_not_null
employee_addresses_house_no_not_null
employee_addresses_street_not_null
employee_addresses_city_not_null
employee_addresses_state_not_null
employee_addresses_pincode_not_null
employee_addresses_country_not_null
fk_employee_address
```

### Documents

```
```

```
employee_documents_pkey
employee_documents_employee_id_not_null
employee_documents_document_name_not_null
employee_documents_document_type_not_null
employee_documents_original_file_name_not_null
employee_documents_mime_type_not_null
employee_documents_file_data_not_null
fk_employee_document
```

---

## Migrations

**UNKNOWN / NEEDS VERIFICATION.**

No formal migration framework was established in the conversation.

Database structure was created/verified directly through PostgreSQL/pgAdmin.

---

# 6. API

## IMPLEMENTED

---

## Departments

### `POST /departments`

Create department.

Request:

```
```

```
{
  "departmentName": "Development",
  "departmentCode": "DEV"
}
```

Response:

```
```

```
{
  "id": 2,
  "department_name": "Development",
  "department_code": "DEV",
  "created_at": "...",
  "updated_at": "..."
}
```

---

### `GET /departments`

Returns all departments.

---

### `GET /departments/:id`

Returns one department.

Not found:

```
```

```
{
  "message": "Department not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### `PUT /departments/:id`

Updates department.

Request:

```
```

```
{
  "departmentName": "Development",
  "departmentCode": "DEV"
}
```

Important: current implementation performs a full update of the two department fields. Sending missing fields can result in database `NOT NULL` failures.

This was encountered during development and subsequently handled by using the complete body.

---

### `DELETE /departments/:id`

Deletes department.

Success:

```
```

```
{
  "message": "Department deleted successfully"
}
```

---

# Designations

### `POST /designations`

```
```

```
{
  "designationName": "Software Engineer"
}
```

---

### `GET /designations`

Returns all designations.

---

### `GET /designations/:id`

Returns one designation.

Not found:

```
```

```
{
  "message": "Designation not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

### `PUT /designations/:id`

```
```

```
{
  "designationName": "Senior Software Engineer"
}
```

---

### `DELETE /designations/:id`

Success:

```
```

```
{
  "message": "Designation deleted successfully"
}
```

---

# Employees

### `GET /employees`

Returns employee records with department/designation joins.

The backend performs:

```
```

```
LEFT JOIN departments
LEFT JOIN designations
```

so responses include:

```
```

```
department_name
designation_name
```

in addition to IDs. 

---

### `GET /employees/:id`

Returns one employee with department/designation information.

Not found:

```
```

```
{
  "message": "Employee not found",
  "error": "Not Found",
  "statusCode": 404
}
```

---

# `POST /employees`

## Purpose

Full employee registration.

## Content type

```
```

```
multipart/form-data
```

### Text fields

```
```

```
employeeData
personalInfo
addresses
documentsMetadata
```

These contain JSON serialized as multipart text fields.

The controller parses them with `JSON.parse()` and converts malformed JSON into:

```
```

```
400 Bad Request
Invalid JSON in multipart form data
```

The finalized controller behavior is shown in the recorded patch. 

### File fields

```
```

```
profilePhoto
aadhaar
pan
drivingLicense
education
experience
resume
```

`education` supports multiple files.

`experience` supports multiple files.

---

## Employee data

Backend-supported fields:

```
```

```
first_name
last_name
email
phone
gender
dob
joining_date
department_id
designation_id
manager_id
employment_type
work_location
status
```

The service internally uses the corresponding camelCase object properties when processing the parsed JSON.

---

## Personal information

```
```

```
fatherName
fatherAadhaarNumber
motherName
motherAadhaarNumber
maritalStatus
nationality
bloodGroup
emergencyContactName
emergencyContactNumber
emergencyContactRelation
```

These are inserted into `employee_personal_info`. 

---

## Addresses

```
```

```
sameAsCurrentAddress
currentAddress
permanentAddress
```

Each address:

```
```

```
houseNo
street
city
state
pincode
country
```

---

## Success response

Confirmed:

```
```

```
{
  "message": "Employee registered successfully",
  "employeeId": 49,
  "employeeCode": "HR-2026-0008"
}
```

The backend generates the employee code.

---

# Employee code generation

Format:

```
```

```
DEPARTMENT_CODE-YEAR-SEQUENCE
```

Examples:

```
```

```
HR-2026-0001
HR-2026-0002
IT-2026-0001
```

The implementation gets:

```
```

```
department_code
```

from the department and searches existing employee codes for the current department/year before generating the next sequence. 

The frontend must **not ask the user to enter** **`employee_code`**.

---

# `PUT /employees/:id`

Updates employee core information.

Content type:

```
```

```
application/json
```

This was an important final decision.

It is **not multipart/form-data**.

The backend validates:

1.  Employee exists 
2.  Department exists 
3.  Designation exists 

Then updates:

```
```

```
first_name
last_name
email
phone
gender
dob
joining_date
department_id
designation_id
manager_id
employment_type
work_location
status
```

`updated_at` is updated automatically.

The employee update was successfully tested with changes such as:

```
```

```
Nick Updated
Nick Final
```

and department:

```
```

```
Development
```

---

# `DELETE /employees/:id`

Deletes employee.

Success:

```
```

```
{
  "message": "Employee deleted successfully"
}
```

The service checks existence before deletion. 

---

# Documents

## `POST /employees/:employeeId/documents`

Uploads a document for an existing employee.

---

## `GET /employees/:employeeId/documents`

Returns the employee's document metadata.

Example:

```
```

```
[
  {
    "id": 93,
    "employeeId": 49,
    "documentName": "Resume - Updated",
    "documentType": "Resume",
    "originalFileName": "Resume.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1992,
    "uploadedAt": "2026-08-17T09:27:49.654Z"
  }
]
```

---

## `GET /documents/:id`

Returns actual binary document content.

It is **not a normal JSON endpoint**.

Examples verified:

-  PDF Aadhaar document rendered as PDF 
-  JPEG profile photo rendered as image 

---

## `PUT /documents/:id`

Updates document metadata.

Request conceptually:

```
```

```
{
  "documentName": "Resume - Updated",
  "documentType": "Resume"
}
```

Success:

```
```

```
{
  "message": "Document updated successfully",
  "document": {
    "id": 93,
    "employeeId": 49,
    "documentName": "Resume - Updated",
    "documentType": "Resume",
    "originalFileName": "Resume.pdf",
    "mimeType": "application/pdf",
    "fileSize": 1992,
    "uploadedAt": "..."
  }
}
```

---

## `DELETE /documents/:id`

Deletes document.

---

# Document keys

Current registration document definitions include:

```
```

```
PROFILE_PHOTO
AADHAAR
PAN
PASSPORT
DRIVING_LICENSE
TENTH
INTERMEDIATE
DIPLOMA
DEGREE
PG
EXPERIENCE
RESUME
```

However:

**Passport exists in the document definitions/documentation history but is NOT part of the current employee-registration upload flow.**

This was explicitly resolved during the frontend handoff: **do not implement Passport registration upload.**

The document definition itself historically contains Passport, which is why Codex should not blindly infer that every defined key is currently required. 

---

# Required registration documents

Required:

```
```

```
PROFILE_PHOTO
AADHAAR
PAN
TENTH
DEGREE
RESUME
```

Exactly one of:

```
```

```
INTERMEDIATE
DIPLOMA
```

Valid:

```
```

```
10th
Intermediate
Degree
```

or:

```
```

```
10th
Diploma
Degree
```

Invalid:

```
```

```
Intermediate + Diploma
```

Invalid:

```
```

```
Neither Intermediate nor Diploma
```

This is enforced in the service. 

---

# Document upload mapping

```
```

```
PROFILE_PHOTO → profilePhoto
AADHAAR       → aadhaar
PAN           → pan
DRIVING_LICENSE → drivingLicense

TENTH         → education
INTERMEDIATE  → education
DIPLOMA       → education
DEGREE        → education
PG            → education

EXPERIENCE    → experience
RESUME        → resume
```

This mapping is explicitly defined in `document-upload.ts`. 

---

# Document validation

Backend validates:

-  metadata must be an array 
-  document key must be valid 
-  filename must exist 
-  uploaded files must exist 
-  metadata/file counts must match 
-  required documents must exist 
-  Intermediate/Diploma business rule 
-  duplicate single-instance documents 
-  file type/content validation 

The implementation explicitly prevents duplicate single-instance documents. 

---

# 7. Authentication & Authorization

## Current authentication

**NONE.**

There is currently:

```
```

```
No login API
No signup API
No JWT
No refresh token
No session
No password authentication
```

## Authorization

**NONE.**

There are currently:

```
```

```
No guards
No role guards
No permissions
No RBAC middleware
```

## Important decision

Authentication was deliberately **not invented** during frontend integration planning.

The frontend may contain UI boundaries for future authentication, but the backend currently has no authentication contract.

---

# 8. Important Business Rules

## 1. Department is a master table

Employees reference departments through:

```
```

```
department_id
```

The department must exist before employee creation.

---

## 2. Department code is required

Department code is used to generate:

```
```

```
employee_code
```

Therefore department master data cannot have arbitrary missing codes. 

---

## 3. Designation must exist

Employee creation validates:

```
```

```
designation_id
```

against the `designations` table.

---

## 4. Employee code is generated by backend

Users do not manually enter:

```
```

```
employee_code
```

Backend generates:

```
```

```
DEPARTMENT-YEAR-SEQUENCE
```

---

## 5. Employee registration is atomic

Registration inserts into multiple tables.

Therefore the entire process is inside one PostgreSQL transaction.

```
```

```
BEGIN
 ↓
employee
 ↓
personal info
 ↓
addresses
 ↓
documents
 ↓
COMMIT
```

Any failure:

```
```

```
ROLLBACK
```

---

## 6. Both current and permanent addresses are stored

Even when:

```
```

```
sameAsCurrentAddress = true
```

two database records are created:

```
```

```
Current
Permanent
```

The permanent values are copied from current. 

---

## 7. Certain documents are mandatory

```
```

```
Profile Photo
Aadhaar
PAN
10th
Degree
Resume
```

---

## 8. Education path

Exactly one:

```
```

```
Intermediate
```

or:

```
```

```
Diploma
```

must accompany the mandatory 10th + Degree path.

---

## 9. Single-instance documents

Only one of each is allowed:

```
```

```
Profile Photo
Aadhaar
PAN
Driving License
10th
Intermediate
Diploma
Degree
PG
Resume
```

Experience is allowed to contain multiple files. 

---

## 10. Dates

The backend/database uses PostgreSQL `DATE` semantics for:

```
```

```
dob
joining_date
```

During frontend integration, use:

```
```

```
YYYY-MM-DD
```

and avoid unnecessary timezone conversion.

---

## 11. SQL is parameterized

Database queries use:

```
```

```
client.query(sql, params)
```

rather than string concatenation.

This protects against SQL injection for the values being passed as parameters.

---

# 9. Coding Conventions

## Naming

Database:

```
```

```
snake_case
```

Examples:

```
```

```
department_name
employee_code
joining_date
```

JavaScript/TypeScript request objects have used camelCase in several places:

```
```

```
departmentName
designationName
departmentId
joiningDate
```

Employee database columns remain snake\_case.

---

## Controller/service separation

Controllers should remain thin:

```
```

```
Controller
   ↓
Service
```

Business logic belongs in services.

---

## Database access

Services use:

```
```

```
DbService
```

rather than opening PostgreSQL connections directly.

---

## Transactions

Use:

```
```

```
const client = await dbService.getClient();
```

for multi-query atomic operations.

Then:

```
```

```
BEGIN
...
COMMIT
```

or:

```
```

```
ROLLBACK
```

and always:

```
```

```
client.release()
```

---

## Validation

No DTO validation layer.

Business validation is implemented using:

```
```

```
NotFoundException
BadRequestException
database constraints
file validation
explicit service checks
```

---

## Error handling

Expected business errors use NestJS exceptions:

```
```

```
NotFoundException
BadRequestException
```

Examples:

```
```

```
Department not found
Designation not found
Employee not found
Document not found
```

---

## SQL

Use parameterized SQL:

```
```

```
WHERE id = $1
```

with:

```
```

```
[id]
```

Do not interpolate user values into SQL.

---

# 10. Important Decisions

## Decision 1

**Use PostgreSQL**

**Reason:**

The HRMS is relational and has strong relationships between employees, departments, designations, addresses, personal information and documents.

**Alternatives considered:**

No competing database was adopted.

**Current status:**

Implemented.

---

## Decision 2

**Use raw SQL with** **`pg`** **rather than Prisma**

**Reason:**

The project was intentionally built to understand SQL and PostgreSQL directly.

**Alternative:**

Prisma.

**Why rejected:**

Not needed for the current implementation and would abstract away the SQL/database concepts being learned.

**Current status:**

Implemented.

---

## Decision 3

**Use a custom** **`DbService`**

**Reason:**

Centralizes database access and provides both:

```
```

```
query()
getClient()
```

**Current status:**

Implemented.

---

## Decision 4

**Use transactions for employee registration**

**Reason:**

Registration modifies multiple related tables and must either fully succeed or fully fail.

**Alternative:**

Independent queries.

**Why rejected:**

Could leave partial employee records.

**Current status:**

Implemented.

---

## Decision 5

**Store uploaded documents in PostgreSQL**

**Reason:**

Current backend requirements use database binary storage.

**Alternative:**

S3/object storage.

**Why rejected:**

Not required for the current implementation.

**Current status:**

Implemented.

---

## Decision 6

**No DTO validation**

**Reason:**

Explicit user decision to proceed without DTO validation.

**Alternative:**

NestJS DTOs + `class-validator`.

**Current status:**

Rejected for current project stage.

---

## Decision 7

**Backend generates employee code**

**Reason:**

Employee code depends on department code, year and sequence.

**Current status:**

Implemented.

---

## Decision 8

**Employee create uses multipart**

**Reason:**

Employee registration combines structured JSON data with document files.

**Current status:**

Implemented.

---

## Decision 9

**Employee update uses JSON**

**Reason:**

Employee core data update does not require multipart upload.

**Current status:**

Implemented and tested.

---

## Decision 10

**Document management is a separate API concern**

**Reason:**

Documents have their own lifecycle:

```
```

```
upload
list
view
update metadata
delete
```

**Current status:**

Implemented.

---

## Decision 11

**Do not invent authentication**

**Reason:**

No authentication backend exists yet.

**Current status:**

Deferred.

---

## Decision 12

**Do not implement unsupported HRMS APIs just because the documentation describes them**

**Reason:**

Documentation describes the complete product scope, but current backend implementation only covers a subset.

**Current status:**

Active rule.

---

# 11. Things Explicitly Rejected

Codex must not casually reintroduce:

### Prisma

Not used for current CRUD.

### DTO validation

Explicitly deferred.

### JWT authentication

Not implemented.

### Refresh tokens

Not implemented.

### Fake login API

Not implemented.

### Fake RBAC

Not implemented.

### Fake APIs for recruitment/leave/payroll/etc.

Not implemented.

### Passport registration upload

Excluded from current registration flow.

### Random department/designation master data

The official documentation defines the initial departments/designations; we should not invent organizational master data.

The documentation lists:

```
```

```
HR
Development
Testing
DevOps
Sales
Finance
```

and:

```
```

```
Software Engineer
Associate Software Developer
Senior Developer
Team Lead
Project Manager
```

---

# 12. Current Implementation State

## Completed

### Department

-  POST 
-  GET all 
-  GET by ID 
-  PUT 
-  DELETE 

### Designation

-  POST 
-  GET all 
-  GET by ID 
-  PUT 
-  DELETE 

### Employee

-  GET all 
-  GET by ID 
-  POST 
-  PUT 
-  DELETE 

### Employee registration

-  employee creation 
-  personal info 
-  current address 
-  permanent address 
-  same-address logic 
-  employee-code generation 
-  transaction 
-  document validation 
-  document persistence 

### Documents

-  upload 
-  list 
-  individual retrieval 
-  binary preview 
-  metadata update 
-  delete 

### Verification

Successful employee/document registration was verified through:

```
```

```
Postman
pgAdmin
PostgreSQL queries
```

---

## In progress

**API audit and frontend integration preparation.**

---

## Broken / needs fixing

No confirmed functional blocker remains from the previously tested CRUD flow.

There are, however, items requiring verification before production/integration:

1.  CORS configuration 
2.  Automated tests 
3.  API error normalization 
4.  Production file-storage strategy 
5.  Authentication/RBAC 
6.  Migration strategy 

---

## Not started

```
```

```
Authentication
Authorization/RBAC
Recruitment APIs
Leave APIs
Shift APIs
Attendance APIs
Payroll APIs
Training APIs
Performance APIs
ESS APIs
Reports APIs
Separation APIs
```

---

## Blocked

The broader HRMS modules are effectively blocked on their backend/API design and implementation.

Authentication/RBAC is blocked on an agreed authentication contract.

---

# 13. Known Bugs and Technical Debt

## 1. CORS

The backend currently did not have explicit:

```
```

```
app.enableCors(...)
```

configuration in the discussed `main.ts`.

During frontend development, a Vite proxy was planned to communicate with:

```
```

```
http://localhost:3000
```

For production, the backend will need explicit CORS configuration for the real frontend origin.

**Status:** needs verification/final integration handling.

---

## 2. `EADDRINUSE :3000`

This occurred:

```
```

```
Error: listen EADDRINUSE: address already in use :::3000
```

Cause:

Another process was already using port `3000`.

This is a local development/process-management issue, not an application business-logic bug.

---

## 3. Department update with incomplete body

A request resulted in:

```
```

```
null value in column "department_name"
```

because the update query writes both:

```
```

```
department_name
department_code
```

while missing properties become `null`.

Current practice:

Send the complete department update body.

---

## 4. Invalid department ID

Employee PUT initially produced:

```
```

```
{
  "message": "Department not found",
  "error": "Not Found",
  "statusCode": 404
}
```

because the request referenced a department ID that did not exist.

This was diagnosed and corrected by using a valid department.

---

## 5. Invalid designation

Similarly, employee registration/update validates designation IDs and returns:

```
```

```
Designation not found
```

for invalid IDs.

---

## 6. Duplicate designation

Attempting to create an existing designation produced PostgreSQL:

```
```

```
23505
duplicate key value violates unique constraint
```

Example:

```
```

```
designations_designation_name_key
```

This proves the database unique constraint is working.

However, the exact final state of a custom error mapper for PostgreSQL `23505` is **UNKNOWN**.

Do not assume it exists.

---

## 7. File metadata mismatch

An earlier registration attempt failed because the uploaded filename did not match the metadata/field expectations:

```
```

```
Uploaded file ... was not found in field ...
```

This was resolved by aligning:

```
```

```
documentsMetadata
```

with the actual uploaded filenames and backend upload fields.

---

## 8. Document storage scalability

Current design stores complete binary files inside PostgreSQL.

This works for the current project and was deliberately implemented.

For production at significant scale, storage strategy may eventually need reconsideration.

Do **not** change it during frontend integration without an explicit architectural decision.

---

## 9. No automated tests

No established automated unit/integration/e2e test suite was demonstrated.

Current verification has primarily been:

```
```

```
Postman
pgAdmin
manual API testing
npm run build
git diff --check
```

---

# 14. Current Task / Immediate Next Steps

## What we were trying to accomplish

We finished the backend's initial CRUD and employee/document implementation and were preparing it for **frontend integration**.

The frontend developer/AI agent needs a precise backend contract.

---

## Already done

```
```

```
Departments CRUD        ✅
Designations CRUD       ✅
Employees CRUD          ✅
Employee registration   ✅
Transactions            ✅
Documents               ✅
Document binary GET     ✅
Document metadata PUT   ✅
Database verification   ✅
Build verification      ✅
```

---

## Remaining

### Step 1 — API audit

Verify every endpoint:

```
```

```
method
route
request
response
errors
content type
```

### Step 2 — CORS/frontend connectivity

Verify:

```
```

```
Frontend → http://localhost:3000
```

works from a browser.

### Step 3 — Frontend integration

Real API-backed modules:

```
```

```
Departments
Designations
Employees
Documents
```

### Step 4 — Integration testing

Test complete flow:

```
```

```
React form
   ↓
Axios
   ↓
NestJS
   ↓
PostgreSQL
```

including multipart employee registration.

---

## Files likely involved

```
```

```
src/main.ts

src/db/db.service.ts

src/department/
src/designation/

src/employee/
├── employee.controller.ts
├── employee.service.ts
├── employee.module.ts
├── document.controller.ts
├── document.service.ts
└── constants/

src/common/
├── multer.config.ts
├── document-upload.ts
└── file-validation.ts
```

---

## Do NOT change casually

Do not casually change:

```
```

```
Database schema
Employee-code generation
Transaction boundaries
Multipart field names
Document keys
Required document rules
Department/designation IDs
API routes
snake_case database columns
```

These are established contracts.

---

# 15. Files / Code Deserving Special Attention

## `src/employee/employee.service.ts`

**Highest priority.**

Contains:

-  employee retrieval 
-  employee creation 
-  transaction 
-  employee-code generation 
-  personal information insertion 
-  address insertion 
-  document validation 
-  employee update 
-  employee deletion 

The employee service is the core business-logic file.

---

## `src/employee/employee.controller.ts`

Important for the frontend contract.

Defines:

```
```

```
/employees
/employees/:id
```

and multipart registration.

The final controller uses `FileFieldsInterceptor` with:

```
```

```
profilePhoto
aadhaar
pan
drivingLicense
education
experience
resume
```

---

## `src/employee/document.controller.ts`

Defines:

```
```

```
/employees/:employeeId/documents
/documents/:id
```

---

## `src/employee/document.service.ts`

Contains document lifecycle operations.

---

## `src/common/document-upload.ts`

Centralizes:

```
```

```
document upload fields
document-key → multipart field mapping
single-document rules
metadata validation
```

---

## `src/employee/constants/document.constants.ts`

Defines document metadata such as:

```
```

```
document name
document type
document key
```

---

## `src/common/file-validation.ts`

Critical for uploaded-file validation.

---

## `src/common/multer.config.ts`

Controls Multer's in-memory upload configuration.

---

## `src/db/db.service.ts`

Core database infrastructure.

Current responsibilities:

```
```

```
Pool creation
connection test
query()
getClient()
pool shutdown
```

---

## Department files

```
```

```
src/department/department.controller.ts
src/department/department.service.ts
```

Simple CRUD but important because departments are referenced by employees and department codes drive employee-code generation.

---

## Designation files

```
```

```
src/designation/designation.controller.ts
src/designation/designation.service.ts
```

Simple CRUD and employee foreign-key dependency.

---

# 16. Environment / Configuration

Actual secret values are intentionally omitted.

Known configuration concept:

```
```

```
DB_HOST=<secret/config>
DB_PORT=<secret/config>
DB_USER=<secret/config>
DB_PASSWORD=<secret>
DB_NAME=<secret/config>
```

`DbService` reads these through `ConfigService`.

The application listens on:

```
```

```
PORT=<optional>
```

with:

```
```

```
3000
```

as the current default.

### Important

Do not commit:

```
```

```
.env
database password
database credentials
API keys
JWT secrets
```

There is currently no confirmed:

```
```

```
JWT_SECRET
API_KEY
AWS credentials
S3 bucket
```

because those systems are not implemented.

---

# 17. Commands

## Install

Known package manager:

```
```

```
npm install
```

---

## Development

The project was run through Nest's development workflow.

Exact `package.json` script configuration should be verified before assuming the exact command.

Likely project script names include the standard Nest setup, but **only** **`npm run build`** **is explicitly confirmed from the conversation**.

---

## Build

Confirmed:

```
```

```
npm run build
```

Output:

```
```

```
> hrms-backend@0.0.1 build
> nest build
```

The build completed successfully.

---

## Git verification

Used:

```
```

```
git status
```

```
```

```
git diff --check
```

```
```

```
git diff --stat
```

```
```

```
git diff
```

---

## Git staging/commit

Commands discussed:

```
```

```
git add ...
```

was an error because literal `...` was supplied.

Correct Git usage was discussed afterward, but the exact final commit command should be verified from repository history.

A commit message that was attempted was:

```
```

```
feat: finalize HRMS employee and document APIs
```

but at that point nothing had been staged, so the commit did **not** occur.

Later the project reached a confirmed clean working tree state:

```
```

```
On branch master
Your branch is up to date with 'origin/master'.

nothing to commit, working tree clean
```

---

## Docker

**UNKNOWN / not established.**

---

## Database migrations

**UNKNOWN / no migration command established.**

---

# 18. Testing

## Existing testing approach

Primarily manual API testing with:

```
```

```
Postman
pgAdmin
PostgreSQL SQL queries
```

---

## Tested

### Departments

```
```

```
POST
GET
GET/:id
PUT
DELETE
GET invalid ID
```

### Designations

```
```

```
POST
GET
GET/:id
PUT
DELETE
GET invalid ID
```

### Employees

```
```

```
POST
GET
GET/:id
PUT
DELETE
```

### Documents

```
```

```
POST
GET employee documents
GET individual document
PUT document metadata
DELETE document
GET invalid document
```

---

## Verified document types

```
```

```
Profile Photo → JPEG
Aadhaar → PDF
PAN → PDF
10th → PDF
Intermediate → PDF
Degree → PDF
Resume → PDF
```

The database was queried and verified to contain seven documents for employee `49`.

---

## Automated tests

**UNKNOWN / none established in this conversation.**

Codex should not claim that Jest unit tests or Supertest e2e tests already exist without inspecting the repository.

---

# 19. Security Considerations

## SQL injection

Current SQL uses parameterized PostgreSQL queries:

```
```

```
WHERE id = $1
```

with parameters passed separately.

Preserve this.

---

## Authentication

Not implemented.

Do not expose the current backend as a production-secure HRMS system yet.

---

## Authorization

Not implemented.

Anyone capable of reaching the current API is not restricted by application-level roles.

This is acceptable for the current development stage but is a major production requirement.

---

## File uploads

File uploads are validated.

The backend checks:

-  document key 
-  filename 
-  file type/content 
-  file size 
-  duplicate document rules 
-  required documents 

The file validation is therefore an important security boundary.

---

## Sensitive data

The database contains potentially sensitive HR information:

```
```

```
Aadhaar-related information
employee phone
email
family information
emergency contacts
employee documents
```

Do not log full request bodies or document contents.

---

## File storage

Current storage:

```
```

```
PostgreSQL binary data
```

No external object-storage credentials exist.

---

## CORS

Needs final integration verification.

Current frontend development plan uses Vite proxy.

---

## Rate limiting

Not implemented.

---

## Password security

Not applicable yet because authentication is not implemented.

---

## Error exposure

A known concern is raw PostgreSQL errors such as:

```
```

```
23505 duplicate key
```

appearing in development logs/responses.

The exact final production error-normalization strategy is **NOT established**.

---

# 20. CODEx OPERATING CONTEXT

Use the following directly as the operating context for Codex:

```
```

```
# HRMS Backend — Codex Operating Context

This repository is the backend for an HRMS (Human Resource Management System).

Current stack:

- NestJS
- TypeScript
- Node.js
- Express via NestJS
- PostgreSQL
- node-postgres (`pg`)
- Multer
- REST APIs
- npm
- Nest CLI

Database access uses a custom DbService with:
- query()
- getClient()

Do NOT introduce Prisma for the current implementation.

The backend currently implements:

- Departments CRUD
- Designations CRUD
- Employees CRUD
- Employee registration
- Employee personal information
- Employee addresses
- Employee documents

Current implemented routes:

Departments:
POST   /departments
GET    /departments
GET    /departments/:id
PUT    /departments/:id
DELETE /departments/:id

Designations:
POST   /designations
GET    /designations
GET    /designations/:id
PUT    /designations/:id
DELETE /designations/:id

Employees:
GET    /employees
GET    /employees/:id
POST   /employees
PUT    /employees/:id
DELETE /employees/:id

Documents:
POST   /employees/:employeeId/documents
GET    /employees/:employeeId/documents
GET    /documents/:id
PUT    /documents/:id
DELETE /documents/:id

Employee POST uses multipart/form-data.

Employee PUT uses JSON.

Employee registration multipart text fields:

employeeData
personalInfo
addresses
documentsMetadata

Employee registration file fields:

profilePhoto
aadhaar
pan
drivingLicense
education
experience
resume

The backend generates employee_code.

Employee-code format:

DEPARTMENT_CODE-YEAR-SEQUENCE

Example:

HR-2026-0001

Never ask the client to generate employee_code.

Employee registration is transactional.

The transaction covers:

- employee
- personal information
- current address
- permanent address
- documents

If any part fails, rollback the transaction.

Database tables:

departments
designations
employees
employee_personal_info
employee_addresses
employee_documents

employees references:

departments
designations
employees through manager_id

employee_personal_info has a unique employee_id.

Documents are stored as binary data in PostgreSQL.

Required employee registration documents:

PROFILE_PHOTO
AADHAAR
PAN
TENTH
DEGREE
RESUME

Exactly one of:

INTERMEDIATE
DIPLOMA

must also be supplied.

Do not allow both Intermediate and Diploma.

Passport is NOT part of the current registration flow even though it appears in historical/documentation definitions.

Document upload mapping:

PROFILE_PHOTO -> profilePhoto
AADHAAR -> aadhaar
PAN -> pan
DRIVING_LICENSE -> drivingLicense
TENTH -> education
INTERMEDIATE -> education
DIPLOMA -> education
DEGREE -> education
PG -> education
EXPERIENCE -> experience
RESUME -> resume

Single-instance documents must not be duplicated.

Experience may contain multiple files.

Dates such as dob and joining_date are date-only values.
Use YYYY-MM-DD.
Do not introduce unnecessary timezone conversions.

There is intentionally NO DTO validation layer.
Do not add class-validator DTOs unless explicitly requested.

Business validation currently lives in services/common utilities/database constraints.

There is currently NO:

- authentication
- JWT
- refresh tokens
- password system
- authorization
- RBAC
- login API
- permission API

Do not invent any of these.

The broader HRMS documentation describes:

- Recruitment
- Leave
- Shifts
- Attendance
- Payroll
- Training
- Performance
- ESS
- Reports
- Separation

but those backend APIs are NOT currently implemented.

Do not fabricate APIs for them.

The database is relational and referential integrity must be preserved.

Use parameterized SQL.
Never concatenate user-controlled values into SQL.

Use DbService rather than opening database connections directly.

For multi-query atomic operations use PoolClient transactions:

BEGIN
...
COMMIT

and on failure:

ROLLBACK

Always release the client.

Keep controllers thin.
Business logic belongs in services.

Do not casually change:
- API routes
- database columns
- foreign keys
- employee-code generation
- document keys
- multipart field names
- required document rules
- transaction boundaries

Inspect the existing source before modifying anything.

Do not assume the documentation and implementation are identical.

When documentation describes functionality that does not exist in the backend, treat the current implementation as authoritative.

Do not invent:
- APIs
- database fields
- dependencies
- authentication flows
- business rules

Known development issue:

Port 3000 can fail with EADDRINUSE if another Nest process is already running.

The backend currently needs CORS/integration verification for the frontend.
The frontend development plan uses a Vite proxy.

Before changing architecture:
1. inspect the relevant files
2. inspect current behavior
3. identify the actual problem
4. make the smallest appropriate change
5. build
6. manually test affected endpoints
7. report exactly what changed

Known verification command:

npm run build

Also use:

git status
git diff --check

when appropriate.

Current milestone:

Backend CRUD and employee/document APIs are completed.

Current task:

API audit and frontend integration preparation.

Immediate next work:

1. Audit API contracts.
2. Verify CORS/frontend communication.
3. Provide frontend developer with exact API contract.
4. Integrate departments.
5. Integrate designations.
6. Integrate employees.
7. Integrate employee registration multipart flow.
8. Integrate documents.
9. Run complete frontend/backend integration testing.

Do not start implementing a new architecture unless explicitly requested.

When reporting a change, include:
- files changed
- reason
- behavior changed
- tests/build performed
- remaining concerns
```

---

# 21. Current Project Snapshot

```
```

```
Project:
HRMS Backend

Stack:
NestJS + TypeScript + Express + PostgreSQL + pg + Multer + npm

Architecture:
NestJS Controller → Service → DbService → PostgreSQL

Database:
PostgreSQL, relational schema with departments, designations, employees,
personal information, addresses and documents.

Auth:
Not implemented.

Authorization:
Not implemented.

Current milestone:
Backend CRUD + employee/document APIs completed; preparing for API audit
and frontend integration.

Current task:
Audit the backend API contract and integrate it with the React frontend.

Completed:
- Department CRUD
- Designation CRUD
- Employee CRUD
- Employee registration
- Employee-code generation
- Transactional registration
- Personal information
- Current/permanent addresses
- Document uploads
- Document validation
- Document listing
- Binary document retrieval
- Document metadata update
- Document deletion
- PostgreSQL verification
- Build verification

In progress:
- API audit
- Frontend integration preparation

Known problems:
- CORS needs final integration verification
- No automated test suite established
- Authentication/RBAC not implemented
- Broader HRMS modules have no backend APIs yet
- Production file-storage strategy is not established
- Migration strategy is not established
- Exact production error-normalization strategy is not established

Next step:
Perform a backend API audit and then integrate the real APIs with the frontend.

Critical constraints:
- Inspect existing code before modifying it.
- Preserve current architecture.
- Do not introduce Prisma.
- Do not add DTO validation unless explicitly requested.
- Do not invent authentication/RBAC.
- Do not invent unsupported APIs.
- Do not change multipart field names casually.
- Do not change document business rules.
- Do not change employee-code generation casually.
- Preserve PostgreSQL referential integrity.
- Use parameterized SQL.
- Preserve employee registration transaction boundaries.
- Treat current backend implementation as the source of truth for implemented APIs.
- Treat HRMS documentation as the source of truth for broader product scope only.
```

### One important handoff note

There is a **documentation-vs-implementation discrepancy** that Codex must understand immediately: the HRMS documentation describes a broad Frappe HRMS-based product and mentions Fastify/React/React Native, while the backend we actually built and tested is a **NestJS + Express + PostgreSQL +** **`pg`** **implementation**. The documentation itself states the broader product scope and its conceptual stack, but our actual current backend uses the implementation described above