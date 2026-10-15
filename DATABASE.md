# Library Management System
## Database Documentation

### 1. Introduction

The Library Management System is a web-based application
designed to make library operations easier and more organized.

The application uses an online database to store and manage
library-related information.

Supabase is used as the online database platform.
Supabase uses PostgreSQL as its relational database engine.

### 2. Database Technology

Database Platform: Supabase
Database Engine: PostgreSQL

Supabase provides online database services that allow
applications to store, retrieve, and manage information.

PostgreSQL organizes information into tables containing
rows and columns.

### 3. Database Tables

The Supabase database contains the following tables:

#### 3.1 Books Table

Table Name: books

Purpose:
The books table stores information about books available
in the library.

It helps the application organize and retrieve book details.

#### 3.2 Issued Books Table

Table Name: issued_books

Purpose:
The issued_books table stores information about books
issued to users.

The table includes fields such as:
- id
- book_id
- user_id
- issue_date
- due_date

The book_id identifies the related book.
The user_id identifies the related user.
The issue_date records when the book was issued.
The due_date records when the book is expected to be returned.

#### 3.3 Profiles Table

Table Name: profiles

Purpose:
The profiles table stores user profile information
required by the application.

#### 3.4 User Roles Table

Table Name: user_roles

Purpose:
The user_roles table stores information related to
user roles and permissions.

Roles can help the application distinguish between
different types of users, depending on the implementation.

### 4. How the Database Works

The application communicates with its backend and database
to perform the required operations.

A typical workflow is:

1. A user opens the Library Management System.
2. The application requests the required information.
3. The backend or database client processes the request.
4. Supabase provides the permitted database records.
5. The application displays the information to the user.

The exact workflow depends on how the application code
connects to Supabase.

### 5. Relationships Between Tables

The issued_books table contains book_id and user_id fields.

These fields identify the book and user associated with
an issue record.

The exact foreign-key relationships should be confirmed
from the database schema.

### 6. Database Security

Database security is important because the application
may store user information and library records.

The database should use appropriate access permissions
and Row Level Security (RLS) policies.

Secret keys and database passwords must not be included
in public source code.

### 7. Benefits of Using an Online Database

- Information can be stored digitally.
- Records can be retrieved when required.
- Book and issue information can be organized.
- Database information can be managed centrally.
- The application can access permitted data online.

### 8. Conclusion

Supabase and PostgreSQL provide the online data storage
used by the Library Management System.

The database contains tables for books, issued books,
user profiles, and user roles.

These tables help organize the information required
for library-related operations.
