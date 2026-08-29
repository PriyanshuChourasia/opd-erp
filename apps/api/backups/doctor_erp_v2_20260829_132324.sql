--
-- PostgreSQL database dump
--

\restrict ebRDjCmUV0KpaubTOXaXanC2o78V6xvNhffw0A0GXV8kUhPCWG8Mv5ZxGZVmZo5

-- Dumped from database version 17.7 (Homebrew)
-- Dumped by pg_dump version 17.7 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: primesysindia
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO primesysindia;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: primesysindia
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AllergyCategory; Type: TYPE; Schema: public; Owner: primesysindia
--

CREATE TYPE public."AllergyCategory" AS ENUM (
    'DRUG',
    'FOOD',
    'ENVIRONMENTAL',
    'OTHER'
);


ALTER TYPE public."AllergyCategory" OWNER TO primesysindia;

--
-- Name: AllergySeverity; Type: TYPE; Schema: public; Owner: primesysindia
--

CREATE TYPE public."AllergySeverity" AS ENUM (
    'MILD',
    'MODERATE',
    'SEVERE',
    'LIFE_THREATENING'
);


ALTER TYPE public."AllergySeverity" OWNER TO primesysindia;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Address; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Address" (
    id text NOT NULL,
    "addressType" text NOT NULL,
    "addressLine1" text NOT NULL,
    "addressLine2" text,
    landmark text,
    city text,
    district text,
    state text,
    country text DEFAULT 'India'::text NOT NULL,
    "postalCode" text,
    latitude double precision,
    longitude double precision,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "addressableType" text NOT NULL,
    "addressableId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Address" OWNER TO primesysindia;

--
-- Name: Allergy; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Allergy" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    severity public."AllergySeverity" DEFAULT 'MODERATE'::public."AllergySeverity" NOT NULL,
    category public."AllergyCategory" DEFAULT 'OTHER'::public."AllergyCategory" NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Allergy" OWNER TO primesysindia;

--
-- Name: Appointment; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Appointment" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    type text DEFAULT 'CONSULTATION'::text NOT NULL,
    status text DEFAULT 'SCHEDULED'::text NOT NULL,
    "tokenNumber" text,
    amount integer DEFAULT 0 NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "cancellationReason" text,
    "createdById" text,
    "registrationFee" integer DEFAULT 0 NOT NULL,
    "reasonForVisit" text,
    "updatedById" text
);


ALTER TABLE public."Appointment" OWNER TO primesysindia;

--
-- Name: Bill; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Bill" (
    id text NOT NULL,
    "patientId" text,
    "invoiceNo" text NOT NULL,
    subtotal integer DEFAULT 0 NOT NULL,
    discount integer DEFAULT 0 NOT NULL,
    tax integer DEFAULT 0 NOT NULL,
    total integer DEFAULT 0 NOT NULL,
    "paymentMethod" text DEFAULT 'CASH'::text NOT NULL,
    status text DEFAULT 'PENDING'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "appointmentId" text,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Bill" OWNER TO primesysindia;

--
-- Name: BillItem; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."BillItem" (
    id text NOT NULL,
    "billId" text NOT NULL,
    "itemType" text NOT NULL,
    "itemId" text,
    "itemName" text NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    "unitPrice" integer NOT NULL,
    amount integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."BillItem" OWNER TO primesysindia;

--
-- Name: BloodGroup; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."BloodGroup" (
    id text NOT NULL,
    name text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."BloodGroup" OWNER TO primesysindia;

--
-- Name: CustomModule; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."CustomModule" (
    id text NOT NULL,
    definition jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."CustomModule" OWNER TO primesysindia;

--
-- Name: Department; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Department" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Department" OWNER TO primesysindia;

--
-- Name: Designation; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Designation" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Designation" OWNER TO primesysindia;

--
-- Name: Diagnosis; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Diagnosis" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text,
    "diagnosisSystemId" text,
    code text NOT NULL,
    status text DEFAULT 'ACTIVE'::text NOT NULL
);


ALTER TABLE public."Diagnosis" OWNER TO primesysindia;

--
-- Name: DiagnosisSystem; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."DiagnosisSystem" (
    id text NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    version text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."DiagnosisSystem" OWNER TO primesysindia;

--
-- Name: Dispensing; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Dispensing" (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    "medicineId" text NOT NULL,
    "medicineName" text NOT NULL,
    quantity integer NOT NULL,
    "batchNo" text,
    "expiryDate" timestamp(3) without time zone,
    notes text,
    "dispensedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "dispensedBy" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Dispensing" OWNER TO primesysindia;

--
-- Name: Doctor; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Doctor" (
    id text NOT NULL,
    specialization text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "consultationFee" integer DEFAULT 0 NOT NULL,
    "consultationMode" text DEFAULT 'OFFLINE'::text NOT NULL,
    "degreeCertificateUrl" text,
    "governmentIdUrl" text,
    "medicalCouncil" text,
    "medicalRegistrationNo" text NOT NULL,
    qualification text,
    "registrationCertificateUrl" text,
    "registrationYear" integer,
    signature text,
    "yearsOfExperience" integer,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Doctor" OWNER TO primesysindia;

--
-- Name: DoctorDepartment; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."DoctorDepartment" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "departmentId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" text
);


ALTER TABLE public."DoctorDepartment" OWNER TO primesysindia;

--
-- Name: DoctorSpecialization; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."DoctorSpecialization" (
    id text NOT NULL,
    "doctorId" text NOT NULL,
    "specializationId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" text
);


ALTER TABLE public."DoctorSpecialization" OWNER TO primesysindia;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Document" (
    id text NOT NULL,
    "documentType" text NOT NULL,
    "fileName" text NOT NULL,
    "originalName" text NOT NULL,
    "mimeType" text NOT NULL,
    "fileSize" integer NOT NULL,
    "filePath" text NOT NULL,
    caption text,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "documentableType" text NOT NULL,
    "documentableId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Document" OWNER TO primesysindia;

--
-- Name: EmployeeSchedule; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."EmployeeSchedule" (
    id text NOT NULL,
    "dayOfWeek" integer NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "shiftId" text,
    "employeeSchedulableType" text NOT NULL,
    "employeeSchedulableId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."EmployeeSchedule" OWNER TO primesysindia;

--
-- Name: FinancialYear; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."FinancialYear" (
    id text NOT NULL,
    name text NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "isCurrent" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."FinancialYear" OWNER TO primesysindia;

--
-- Name: LabOrder; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."LabOrder" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "testName" text NOT NULL,
    category text,
    notes text,
    status text DEFAULT 'ORDERED'::text NOT NULL,
    result text,
    "resultDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."LabOrder" OWNER TO primesysindia;

--
-- Name: Medicine; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Medicine" (
    id text NOT NULL,
    name text NOT NULL,
    "genericName" text,
    "brandName" text,
    category text,
    strength text,
    unit text DEFAULT 'tablet'::text NOT NULL,
    price integer DEFAULT 0 NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text,
    alias text,
    "currentStock" numeric(12,2) DEFAULT 0,
    "groupId" text,
    "openingStock" numeric(12,2) DEFAULT 0,
    "unitId" text
);


ALTER TABLE public."Medicine" OWNER TO primesysindia;

--
-- Name: MedicineGroup; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."MedicineGroup" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."MedicineGroup" OWNER TO primesysindia;

--
-- Name: Organisation; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Organisation" (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    phone text,
    email text,
    website text,
    "registrationNumber" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "registrationFee" integer DEFAULT 100 NOT NULL,
    "discountEnabled" boolean DEFAULT true NOT NULL,
    "maxDiscountPercent" integer DEFAULT 50 NOT NULL,
    "defaultDiscountType" text DEFAULT 'percent'::text NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Organisation" OWNER TO primesysindia;

--
-- Name: Patient; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Patient" (
    id text NOT NULL,
    "contactNo" text NOT NULL,
    email text,
    "dateOfBirth" timestamp(3) without time zone,
    gender text,
    "bloodGroup" text,
    address text,
    "emergencyContact" text,
    allergies text[],
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isFollowUp" boolean DEFAULT false NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdById" text,
    "updatedById" text,
    "patientCode" text NOT NULL,
    "firstName" text NOT NULL,
    "middleName" text,
    "lastName" text NOT NULL,
    "altContactNo" text,
    "bloodGroupId" text
);


ALTER TABLE public."Patient" OWNER TO primesysindia;

--
-- Name: PatientAllergy; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."PatientAllergy" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "allergyId" text NOT NULL,
    notes text,
    "severityOverride" public."AllergySeverity",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."PatientAllergy" OWNER TO primesysindia;

--
-- Name: PatientAllergyRecord; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."PatientAllergyRecord" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    allergen text NOT NULL,
    "allergyType" text,
    reaction text,
    severity text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."PatientAllergyRecord" OWNER TO primesysindia;

--
-- Name: PatientVitals; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."PatientVitals" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "heightCm" double precision,
    "weightKg" double precision,
    bmi double precision,
    "temperatureC" double precision,
    "pulseBpm" integer,
    "systolicBp" integer,
    "diastolicBp" integer,
    "spo2Percent" double precision,
    "respiratoryRate" integer,
    "recordedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" text,
    "medicalStatus" text,
    "appointmentId" text
);


ALTER TABLE public."PatientVitals" OWNER TO primesysindia;

--
-- Name: Permission; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Permission" (
    id text NOT NULL,
    resource text NOT NULL,
    action text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Permission" OWNER TO primesysindia;

--
-- Name: Prescription; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Prescription" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    diagnosis text,
    notes text,
    status text DEFAULT 'ACTIVE'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text,
    version integer DEFAULT 1 NOT NULL
);


ALTER TABLE public."Prescription" OWNER TO primesysindia;

--
-- Name: PrescriptionHistory; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."PrescriptionHistory" (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    version integer NOT NULL,
    diagnosis text,
    notes text,
    status text NOT NULL,
    items jsonb NOT NULL,
    "changeType" text DEFAULT 'UPDATE'::text NOT NULL,
    "changeReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" text
);


ALTER TABLE public."PrescriptionHistory" OWNER TO primesysindia;

--
-- Name: PrescriptionItem; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."PrescriptionItem" (
    id text NOT NULL,
    "prescriptionId" text NOT NULL,
    "medicineId" text NOT NULL,
    "medicineName" text NOT NULL,
    dosage text NOT NULL,
    duration text,
    instructions text,
    quantity integer NOT NULL,
    refills integer DEFAULT 0 NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."PrescriptionItem" OWNER TO primesysindia;

--
-- Name: PrescriptionTemplate; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."PrescriptionTemplate" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isDefault" boolean DEFAULT false NOT NULL,
    "logoUrl" text,
    "clinicName" text,
    "doctorName" text,
    "doctorSpecialization" text,
    "doctorQualification" text,
    "doctorRegNo" text,
    "clinicAddress" text,
    "clinicPhone" text,
    "clinicEmail" text,
    "clinicWebsite" text,
    layout jsonb DEFAULT '{}'::jsonb NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text,
    type text DEFAULT 'prescription'::text NOT NULL,
    "doctorId" text
);


ALTER TABLE public."PrescriptionTemplate" OWNER TO primesysindia;

--
-- Name: ProcedureOrder; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."ProcedureOrder" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "procedureName" text NOT NULL,
    category text,
    notes text,
    status text DEFAULT 'ORDERED'::text NOT NULL,
    result text,
    "resultDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."ProcedureOrder" OWNER TO primesysindia;

--
-- Name: QueueEntry; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."QueueEntry" (
    id text NOT NULL,
    "tokenNumber" text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    status text DEFAULT 'WAITING'::text NOT NULL,
    "queueDate" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "checkedInAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "appointmentId" text,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."QueueEntry" OWNER TO primesysindia;

--
-- Name: RadiologyOrder; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."RadiologyOrder" (
    id text NOT NULL,
    "patientId" text NOT NULL,
    "doctorId" text NOT NULL,
    "studyName" text NOT NULL,
    category text,
    notes text,
    status text DEFAULT 'ORDERED'::text NOT NULL,
    result text,
    "resultDate" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."RadiologyOrder" OWNER TO primesysindia;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."RefreshToken" (
    id text NOT NULL,
    token text NOT NULL,
    "userId" text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "revokedAt" timestamp(3) without time zone,
    "userAgent" text,
    "ipAddress" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."RefreshToken" OWNER TO primesysindia;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Role" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isSystem" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Role" OWNER TO primesysindia;

--
-- Name: RolePermission; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."RolePermission" (
    "roleId" text NOT NULL,
    "permissionId" text NOT NULL
);


ALTER TABLE public."RolePermission" OWNER TO primesysindia;

--
-- Name: RoleSidebarMenu; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."RoleSidebarMenu" (
    "roleId" text NOT NULL,
    "sidebarMenuId" text NOT NULL
);


ALTER TABLE public."RoleSidebarMenu" OWNER TO primesysindia;

--
-- Name: SchemaFieldChange; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."SchemaFieldChange" (
    id text NOT NULL,
    "modelName" text NOT NULL,
    "fieldName" text NOT NULL,
    kind text NOT NULL,
    remark text,
    "editedName" text,
    "editedType" text,
    "fieldType" text,
    "targetModel" text,
    "isRequired" boolean DEFAULT true NOT NULL,
    "isList" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SchemaFieldChange" OWNER TO primesysindia;

--
-- Name: Shift; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Shift" (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    "startTime" text NOT NULL,
    "endTime" text NOT NULL,
    "breakStartTime" text,
    "breakEndTime" text,
    "isOvernight" boolean DEFAULT false NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Shift" OWNER TO primesysindia;

--
-- Name: SidebarMenu; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."SidebarMenu" (
    id text NOT NULL,
    label text NOT NULL,
    path text NOT NULL,
    icon text,
    "group" text NOT NULL,
    "sortOrder" integer DEFAULT 0 NOT NULL,
    "isHidden" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SidebarMenu" OWNER TO primesysindia;

--
-- Name: Specialization; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Specialization" (
    id text NOT NULL,
    name text NOT NULL,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Specialization" OWNER TO primesysindia;

--
-- Name: Unit; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."Unit" (
    id text NOT NULL,
    name text NOT NULL,
    symbol text,
    description text,
    "isActive" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "createdById" text,
    "updatedById" text
);


ALTER TABLE public."Unit" OWNER TO primesysindia;

--
-- Name: User; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL,
    "roleId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    username text NOT NULL,
    "countryCode" text DEFAULT '+91'::text NOT NULL,
    "dateOfBirth" timestamp(3) without time zone,
    "firstName" text NOT NULL,
    gender text,
    "lastName" text NOT NULL,
    "middleName" text,
    "mobileNumber" text,
    "profilePhotoUrl" text,
    qualification text,
    "userableId" text,
    "userableType" text
);


ALTER TABLE public."User" OWNER TO primesysindia;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: primesysindia
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO primesysindia;

--
-- Data for Name: Address; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Address" (id, "addressType", "addressLine1", "addressLine2", landmark, city, district, state, country, "postalCode", latitude, longitude, "isPrimary", "isActive", "addressableType", "addressableId", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: Allergy; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Allergy" (id, name, description, severity, category, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
ea4d587e-1fa9-4a2d-8943-7d310b6b4e2f	Penicillin	Beta-lactam antibiotic allergy	SEVERE	DRUG	t	2026-08-29 07:03:34.919	2026-08-29 07:03:34.919	\N	\N
1c53630e-8b89-43cd-99de-a88f3b202f5e	Sulfa	Sulfonamide antibiotic allergy	MODERATE	DRUG	t	2026-08-29 07:03:34.922	2026-08-29 07:03:34.922	\N	\N
a9f7e882-32fe-4fef-9e23-f69e824bff43	Aspirin	NSAID allergy	MODERATE	DRUG	t	2026-08-29 07:03:34.923	2026-08-29 07:03:34.923	\N	\N
fdc3d763-f213-42a3-b6ca-4a0beaba730b	Ibuprofen	NSAID allergy	MILD	DRUG	t	2026-08-29 07:03:34.924	2026-08-29 07:03:34.924	\N	\N
a97fcdf4-8baf-4432-a9c5-b7e730e65cc5	Codeine	Opioid allergy	MODERATE	DRUG	t	2026-08-29 07:03:34.925	2026-08-29 07:03:34.925	\N	\N
4c92c916-1b2e-404d-8541-f8c7d87fc21e	Latex	Latex/rubber allergy	MODERATE	ENVIRONMENTAL	t	2026-08-29 07:03:34.926	2026-08-29 07:03:34.926	\N	\N
f3fdc318-8f7e-4a33-a9e1-9b898bddec1f	Pollen	Seasonal pollen allergy	MILD	ENVIRONMENTAL	t	2026-08-29 07:03:34.927	2026-08-29 07:03:34.927	\N	\N
5825a366-e127-4ec1-b66b-dba72c0dcaec	Dust	House dust mite allergy	MILD	ENVIRONMENTAL	t	2026-08-29 07:03:34.927	2026-08-29 07:03:34.927	\N	\N
88d4d732-44ff-444b-83cc-a6f4907a6e6b	Peanuts	Peanut/legume allergy	SEVERE	FOOD	t	2026-08-29 07:03:34.928	2026-08-29 07:03:34.928	\N	\N
c4112ffa-fef5-45b8-9460-0af6c6dc68fe	Shellfish	Shellfish allergy	SEVERE	FOOD	t	2026-08-29 07:03:34.929	2026-08-29 07:03:34.929	\N	\N
61b62a97-7f0d-4524-b3c1-7e626c55534e	Eggs	Egg allergy	MODERATE	FOOD	t	2026-08-29 07:03:34.93	2026-08-29 07:03:34.93	\N	\N
f412a851-dc44-4dd3-ae10-67860210ad2b	Milk	Dairy/lactose allergy	MILD	FOOD	t	2026-08-29 07:03:34.93	2026-08-29 07:03:34.93	\N	\N
4b4eaf55-759d-438b-919b-0f5a2b3a886b	Soy	Soy allergy	MILD	FOOD	t	2026-08-29 07:03:34.931	2026-08-29 07:03:34.931	\N	\N
692c3831-2b2e-45d1-8d1f-354ad59b2327	Wheat	Wheat/gluten sensitivity	MODERATE	FOOD	t	2026-08-29 07:03:34.932	2026-08-29 07:03:34.932	\N	\N
3cbc0876-5fe2-4980-b0ab-3296dd42c1c9	Iodine	Contrast dye/iodine allergy	MODERATE	DRUG	t	2026-08-29 07:03:34.933	2026-08-29 07:03:34.933	\N	\N
d7b03548-dfb7-4582-bca7-cd0377371b8c	Bee Sting	Hymenoptera venom allergy	SEVERE	ENVIRONMENTAL	t	2026-08-29 07:03:34.933	2026-08-29 07:03:34.933	\N	\N
\.


--
-- Data for Name: Appointment; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Appointment" (id, "patientId", "doctorId", date, type, status, "tokenNumber", amount, notes, "createdAt", "updatedAt", "cancellationReason", "createdById", "registrationFee", "reasonForVisit", "updatedById") FROM stdin;
4061bcf8-8fb3-4709-a7a7-1b9084525fa9	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	c95d58c6-c888-440e-8e4f-d84f4ea1487c	2026-08-29 07:05:12.907	CONSULTATION	IN_PROGRESS	\N	500	\N	2026-08-29 07:05:12.907	2026-08-29 07:05:12.907	\N	\N	0	\N	\N
d3bae922-ff80-4746-8b63-ab6cb88d111d	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	c95d58c6-c888-440e-8e4f-d84f4ea1487c	2026-08-29 07:35:12.907	CONSULTATION	SCHEDULED	\N	500	\N	2026-08-29 07:05:12.91	2026-08-29 07:05:12.91	\N	\N	0	\N	\N
\.


--
-- Data for Name: Bill; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Bill" (id, "patientId", "invoiceNo", subtotal, discount, tax, total, "paymentMethod", status, notes, "createdAt", "updatedAt", "appointmentId", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: BillItem; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."BillItem" (id, "billId", "itemType", "itemId", "itemName", quantity, "unitPrice", amount, "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: BloodGroup; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."BloodGroup" (id, name, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
f483f2e4-548c-4d21-9563-235c06a14cf8	A+	t	2026-08-29 07:03:35.221	2026-08-29 07:03:35.221	\N	\N
2930da3d-d21d-4b44-ad4c-e7ac049dc3ec	A-	t	2026-08-29 07:03:35.223	2026-08-29 07:03:35.223	\N	\N
f5ebbc24-397b-4ecd-b753-47f1cb09b168	B+	t	2026-08-29 07:03:35.223	2026-08-29 07:03:35.223	\N	\N
44b1cb6b-8f54-4258-8f87-bb62e18cd230	B-	t	2026-08-29 07:03:35.223	2026-08-29 07:03:35.223	\N	\N
17d7cc7a-4ef4-42ca-8e25-17266a49b626	AB+	t	2026-08-29 07:03:35.224	2026-08-29 07:03:35.224	\N	\N
1fb82b47-a85a-4e6a-baed-f3c18311845c	AB-	t	2026-08-29 07:03:35.224	2026-08-29 07:03:35.224	\N	\N
70f4d8e3-4d67-490f-9ed7-00c8d108c944	O+	t	2026-08-29 07:03:35.224	2026-08-29 07:03:35.224	\N	\N
4a14a181-4968-4d6a-b665-6f743b63889d	O-	t	2026-08-29 07:03:35.225	2026-08-29 07:03:35.225	\N	\N
\.


--
-- Data for Name: CustomModule; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."CustomModule" (id, definition, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Department; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Department" (id, name, description, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
7ed6b790-dd64-4854-9643-71424168a507	Cardiology	Heart department	t	2026-08-29 05:23:20.954	2026-08-29 05:23:20.954	0a17b2ce-2978-435b-8ba4-1507c16e9cee	\N
\.


--
-- Data for Name: Designation; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Designation" (id, name, description, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
f843e106-3401-40b5-ac77-51fbc8219f9d	Senior Consultant	\N	t	2026-08-29 05:23:21.054	2026-08-29 05:23:21.054	0a17b2ce-2978-435b-8ba4-1507c16e9cee	\N
\.


--
-- Data for Name: Diagnosis; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Diagnosis" (id, name, description, "createdAt", "updatedAt", "createdById", "updatedById", "diagnosisSystemId", code, status) FROM stdin;
7561a7cf-843b-4485-80f4-8fcbac701ad9	Essential Hypertension	Primary (essential) hypertension without a known secondary cause	2026-08-29 07:03:34.943	2026-08-29 07:03:34.943	\N	\N	\N	I10	ACTIVE
d92ca388-a896-4708-9489-0d3414a0c5d6	Type 2 Diabetes Mellitus	Non-insulin-dependent diabetes mellitus	2026-08-29 07:03:34.944	2026-08-29 07:03:34.944	\N	\N	\N	E11	ACTIVE
91526893-7339-4cf9-8d3e-9c3a5577fd4e	Upper Respiratory Tract Infection	Acute upper respiratory infection of unspecified site — common cold	2026-08-29 07:03:34.945	2026-08-29 07:03:34.945	\N	\N	\N	J06.9	ACTIVE
e7a9821d-2e4d-4bed-8ae5-249c9a57bd0c	Acute Bronchitis	Acute bronchitis of unspecified cause	2026-08-29 07:03:34.945	2026-08-29 07:03:34.945	\N	\N	\N	J20.9	ACTIVE
4b2fb692-fa25-4b4f-a220-ab9c83f56b96	Bronchial Asthma	Asthma of unspecified type	2026-08-29 07:03:34.945	2026-08-29 07:03:34.945	\N	\N	\N	J45.9	ACTIVE
9b425247-fab4-447c-9e7e-7f07b79f8d68	Acute Gastroenteritis	Infectious gastroenteritis and colitis of unspecified origin	2026-08-29 07:03:34.946	2026-08-29 07:03:34.946	\N	\N	\N	A09	ACTIVE
f42983d4-d5e5-45f4-9292-08fcd2fdacb3	Iron Deficiency Anemia	Anemia due to insufficient iron stores	2026-08-29 07:03:34.946	2026-08-29 07:03:34.946	\N	\N	\N	D50.9	ACTIVE
6eb3261d-2dbb-4cbf-9cb2-9217c5151236	Vitamin D Deficiency	Vitamin D deficiency of unspecified severity	2026-08-29 07:03:34.947	2026-08-29 07:03:34.947	\N	\N	\N	E55.9	ACTIVE
edecb495-bddd-4a2a-ae14-cf6c73d9b731	Hypothyroidism	Underactive thyroid gland	2026-08-29 07:03:34.947	2026-08-29 07:03:34.947	\N	\N	\N	E03.9	ACTIVE
c33aba18-5f4d-4b8e-aef4-4f0ab3fd4665	Dengue Fever	Dengue virus infection transmitted by mosquitoes	2026-08-29 07:03:34.948	2026-08-29 07:03:34.948	\N	\N	\N	A90	ACTIVE
3e6b6765-c264-4fae-a035-eef9c4fff732	Typhoid Fever	Salmonella typhi infection	2026-08-29 07:03:34.948	2026-08-29 07:03:34.948	\N	\N	\N	A01.0	ACTIVE
36adf5df-78b1-45ea-a016-b9a323260b71	Urinary Tract Infection	Bacterial infection of the urinary tract	2026-08-29 07:03:34.948	2026-08-29 07:03:34.948	\N	\N	\N	N39.0	ACTIVE
c06a72d7-72ac-4e3b-a111-205f6e328f22	Chronic Obstructive Pulmonary Disease	Chronic airflow limitation due to emphysema or chronic bronchitis	2026-08-29 07:03:34.949	2026-08-29 07:03:34.949	\N	\N	\N	J44.9	ACTIVE
447fdb15-889a-4106-b00f-af896edd5b68	Tuberculosis	Respiratory tuberculosis — confirmed or unspecified	2026-08-29 07:03:34.949	2026-08-29 07:03:34.949	\N	\N	\N	A15.9	ACTIVE
c61cf4e0-40eb-40bf-8d7b-b41b0f99e11b	Dyslipidemia	Abnormal lipid levels in the blood	2026-08-29 07:03:34.95	2026-08-29 07:03:34.95	\N	\N	\N	E78.5	ACTIVE
1286bf68-8c43-4489-8099-ad08830a38ae	GERD	Gastro-esophageal reflux disease without esophagitis	2026-08-29 07:03:34.95	2026-08-29 07:03:34.95	\N	\N	\N	K21.9	ACTIVE
ccd42b4d-426a-4ed9-95b7-2ba411743792	Peptic Ulcer Disease	Peptic ulcer of unspecified site	2026-08-29 07:03:34.951	2026-08-29 07:03:34.951	\N	\N	\N	K27.9	ACTIVE
789f3a78-8bc5-4a84-8508-31f1402569db	Obesity	Generalized obesity of unspecified cause	2026-08-29 07:03:34.951	2026-08-29 07:03:34.951	\N	\N	\N	E66.9	ACTIVE
e0526a02-091c-41a2-a749-10efa0fbc714	Headache - Tension Type	Tension-type headache without specific diagnosis	2026-08-29 07:03:34.951	2026-08-29 07:03:34.951	\N	\N	\N	G44.2	ACTIVE
fefbcbec-51c5-4ec8-bd56-bf63e9a5e861	Migraine	Migraine of unspecified type	2026-08-29 07:03:34.952	2026-08-29 07:03:34.952	\N	\N	\N	G43.9	ACTIVE
0eebb643-0563-444a-ba63-201c042247f3	Acute Pharyngitis	Acute inflammation of the pharynx — most common cause viral	2026-08-29 07:03:34.952	2026-08-29 07:03:34.952	\N	\N	\N	J02.9	ACTIVE
1a639276-33a8-4345-a971-e7f100a8aafd	Influenza	Influenza with other respiratory manifestations, virus not identified	2026-08-29 07:03:34.953	2026-08-29 07:03:34.953	\N	\N	\N	J11.1	ACTIVE
200b1a67-7a6a-4108-ba5a-73215f69df82	Fever of Unknown Origin	Elevated body temperature with cause not yet determined	2026-08-29 07:03:34.953	2026-08-29 07:03:34.953	\N	\N	\N	R50.9	ACTIVE
72e66629-f947-41e2-a37a-0a28fd897b31	Dehydration	Volume depletion — fluid loss exceeding intake	2026-08-29 07:03:34.953	2026-08-29 07:03:34.953	\N	\N	\N	E86	ACTIVE
b32a5cea-4ce8-4e91-a83d-b2c67165c1f5	Insomnia	Difficulty in initiating or maintaining sleep	2026-08-29 07:03:34.954	2026-08-29 07:03:34.954	\N	\N	\N	G47.0	ACTIVE
2bbac6ed-4149-49f3-b2e8-395d1a4f2eee	Fatigue Syndrome	Persistent and unexplained fatigue	2026-08-29 07:03:34.954	2026-08-29 07:03:34.954	\N	\N	\N	R53.83	ACTIVE
f642456e-f7e0-42fa-b563-e7356f2e38e9	Scabies	Sarcoptes scabiei mite infestation	2026-08-29 07:03:34.955	2026-08-29 07:03:34.955	\N	\N	\N	B86	ACTIVE
de9dbae9-a4ca-4f78-9177-a4ab775809f7	Coronary Artery Disease	Atherosclerotic heart disease with angina	2026-08-29 07:03:34.955	2026-08-29 07:03:34.955	\N	\N	\N	I25.1	ACTIVE
b3477c79-4373-45ed-a2b0-27208b6a60c2	Acute Myocardial Infarction	Heart attack — acute transmural or subendocardial	2026-08-29 07:03:34.956	2026-08-29 07:03:34.956	\N	\N	\N	I21.9	ACTIVE
50cf09f6-3323-433f-9b8d-cedee88f8260	Congestive Heart Failure	Heart failure of unspecified type	2026-08-29 07:03:34.956	2026-08-29 07:03:34.956	\N	\N	\N	I50.9	ACTIVE
5ca52660-469d-4bc0-9807-fdf068d293d3	Atrial Fibrillation	Irregular, often rapid heart rhythm originating in the atria	2026-08-29 07:03:34.956	2026-08-29 07:03:34.956	\N	\N	\N	I48	ACTIVE
6098bf1e-ccc5-4b38-878a-9b00416705d7	Stable Angina	Predictable chest pain on exertion due to myocardial ischemia	2026-08-29 07:03:34.957	2026-08-29 07:03:34.957	\N	\N	\N	I20.8	ACTIVE
9b1eb43d-83d8-492d-ab97-fdc6e356dfc2	Deep Vein Thrombosis	Blood clot in deep veins of the lower extremity	2026-08-29 07:03:34.957	2026-08-29 07:03:34.957	\N	\N	\N	I80.2	ACTIVE
57ad55a0-7ffa-405c-b79b-afdaff23a82e	Varicose Veins	Dilated, tortuous superficial veins — lower limb	2026-08-29 07:03:34.958	2026-08-29 07:03:34.958	\N	\N	\N	I83.9	ACTIVE
4e0021cf-d827-4679-8227-b26fe626fb80	Childhood Immunization Routine	Routine childhood vaccination encounter	2026-08-29 07:03:34.958	2026-08-29 07:03:34.958	\N	\N	\N	Z23	ACTIVE
ee65b4d4-3565-4076-8065-af3e2114dbac	Acute Otitis Media	Middle ear infection of unspecified type	2026-08-29 07:03:34.958	2026-08-29 07:03:34.958	\N	\N	\N	H66.9	ACTIVE
bf795ed9-857b-4b58-9c3c-6668be2e4203	Measles	Measles (rubeola) infection without complication	2026-08-29 07:03:34.959	2026-08-29 07:03:34.959	\N	\N	\N	B05.9	ACTIVE
ba07d911-b055-4280-a47b-3d8807bed52d	Chickenpox	Varicella infection — primary infection	2026-08-29 07:03:34.959	2026-08-29 07:03:34.959	\N	\N	\N	B01.9	ACTIVE
4af9211e-bf54-4691-b86c-4e8d33c2fc3f	Mumps	Paramyxovirus infection typically affecting salivary glands	2026-08-29 07:03:34.959	2026-08-29 07:03:34.959	\N	\N	\N	B26.9	ACTIVE
5fd20804-fad3-43e3-8070-1a970ae055bb	Hand Foot Mouth Disease	Coxsackie virus infection — vesicular rash on hands, feet, and mouth	2026-08-29 07:03:34.96	2026-08-29 07:03:34.96	\N	\N	\N	B08.4	ACTIVE
5e75d261-771b-4492-913b-8a0a4b624986	Pediatric Asthma	Mild intermittent asthma in children	2026-08-29 07:03:34.96	2026-08-29 07:03:34.96	\N	\N	\N	J45.2	ACTIVE
2c5a12f2-0c43-41ef-b3da-1c9dc7e3648c	Diarrheal Disease in Children	Non-infectious/unspecified gastroenteritis in pediatric patient	2026-08-29 07:03:34.961	2026-08-29 07:03:34.961	\N	\N	\N	K52.9	ACTIVE
06054916-c5b5-46a8-b958-b756b63125ee	Malnutrition in Children	Unspecified protein-calorie malnutrition	2026-08-29 07:03:34.961	2026-08-29 07:03:34.961	\N	\N	\N	E46	ACTIVE
e8198f95-94cb-4e2c-a5d8-c470a3feb185	Osteoarthritis - Knee	Degenerative joint disease of the knee	2026-08-29 07:03:34.961	2026-08-29 07:03:34.961	\N	\N	\N	M17.9	ACTIVE
572b02e0-595d-4119-a22d-a71d80735b81	Low Back Pain	Non-specific mechanical low back pain	2026-08-29 07:03:34.962	2026-08-29 07:03:34.962	\N	\N	\N	M54.5	ACTIVE
3d6a1b3e-09b1-485d-b53d-16e256151f34	Cervical Spondylosis	Degenerative changes of the cervical spine	2026-08-29 07:03:34.962	2026-08-29 07:03:34.962	\N	\N	\N	M47.2	ACTIVE
d66cb340-c55a-40e4-a511-1a954cef1cdb	Fracture of Forearm	Fracture of the radius or ulna — unspecified part	2026-08-29 07:03:34.962	2026-08-29 07:03:34.962	\N	\N	\N	S52.9	ACTIVE
c918d06e-2c04-4d01-b97b-9601184095a9	Rheumatoid Arthritis	Autoimmune inflammatory arthritis	2026-08-29 07:03:34.963	2026-08-29 07:03:34.963	\N	\N	\N	M06.9	ACTIVE
66f2de0a-07af-49bc-8d48-5c98dc21e9ca	Tennis Elbow	Lateral epicondylitis due to repetitive motion	2026-08-29 07:03:34.963	2026-08-29 07:03:34.963	\N	\N	\N	M77.1	ACTIVE
811a0179-fc1a-4986-ba54-3a6a914399e9	Plantar Fasciitis	Inflammation of the plantar fascia at the heel insertion	2026-08-29 07:03:34.964	2026-08-29 07:03:34.964	\N	\N	\N	M72.2	ACTIVE
d6e11a52-4a76-4e60-84fa-e0c561e4f2a6	Carpal Tunnel Syndrome	Median nerve compression at the wrist	2026-08-29 07:03:34.964	2026-08-29 07:03:34.964	\N	\N	\N	G56.0	ACTIVE
aea29563-fda6-455d-ba96-1f7161ec091f	Rotator Cuff Tear	Injury to one or more rotator cuff tendons of the shoulder	2026-08-29 07:03:34.964	2026-08-29 07:03:34.964	\N	\N	\N	S46.0	ACTIVE
7c95de6b-7f2e-483e-84d3-48a4f457659e	Ankle Sprain	Ligament injury of the ankle	2026-08-29 07:03:34.965	2026-08-29 07:03:34.965	\N	\N	\N	S93.4	ACTIVE
c2b8a54d-8e86-44d3-b1fe-86dcfe9cfb1a	Pregnancy - Routine Antenatal Care	Supervision of normal pregnancy, unspecified trimester	2026-08-29 07:03:34.965	2026-08-29 07:03:34.965	\N	\N	\N	Z34.9	ACTIVE
754a3fae-9499-4804-a8bb-81b81872a070	Menorrhagia	Excessive or prolonged menstrual bleeding	2026-08-29 07:03:34.966	2026-08-29 07:03:34.966	\N	\N	\N	N92.0	ACTIVE
5ccadf22-cb4d-433b-a6a0-22b3fd34578f	Dysmenorrhea	Painful menstruation	2026-08-29 07:03:34.966	2026-08-29 07:03:34.966	\N	\N	\N	N94.6	ACTIVE
fa748ebf-f6c9-4eed-96c5-7064984bebd2	Polycystic Ovarian Syndrome	Hyperandrogenism, anovulation, and polycystic ovaries	2026-08-29 07:03:34.966	2026-08-29 07:03:34.966	\N	\N	\N	E28.2	ACTIVE
42a1358a-3b86-4dd3-9de9-4b9b6f685e3b	Uterine Fibroids	Benign leiomyomas of the uterus	2026-08-29 07:03:34.967	2026-08-29 07:03:34.967	\N	\N	\N	D25.9	ACTIVE
6f304df8-b173-4006-8a30-f5720521d9ca	Cervicitis	Inflammation of the cervix uteri	2026-08-29 07:03:34.967	2026-08-29 07:03:34.967	\N	\N	\N	N72	ACTIVE
c05ee3df-428d-465f-9646-6bf3abdd4e09	Vaginitis	Inflammation of the vagina — infectious or non-infectious	2026-08-29 07:03:34.967	2026-08-29 07:03:34.967	\N	\N	\N	N76.0	ACTIVE
0c416a03-aa58-4fcb-bc95-bef84c48995b	Endometriosis	Presence of endometrial tissue outside the uterine cavity	2026-08-29 07:03:34.968	2026-08-29 07:03:34.968	\N	\N	\N	N80.9	ACTIVE
7073c1b4-6197-4e86-a2e8-529ef3bcd007	Cervical Dysplasia	Abnormal cervical epithelial cells on Pap smear	2026-08-29 07:03:34.968	2026-08-29 07:03:34.968	\N	\N	\N	N87.9	ACTIVE
9a6cffb8-cffc-49d6-be23-dc7095837e09	Breast Lump - Benign	Palpable breast lump of undetermined nature	2026-08-29 07:03:34.968	2026-08-29 07:03:34.968	\N	\N	\N	N63	ACTIVE
79744e81-8993-473b-8f34-faf71045d0df	Acne Vulgaris	Common acne involving face, chest, or back	2026-08-29 07:03:34.969	2026-08-29 07:03:34.969	\N	\N	\N	L70.0	ACTIVE
bf0b1fa7-f3e0-4470-8766-8fc744730d95	Eczema / Atopic Dermatitis	Chronic inflammatory skin condition with pruritus	2026-08-29 07:03:34.969	2026-08-29 07:03:34.969	\N	\N	\N	L20.9	ACTIVE
620ccc80-c0b1-4f98-8f9d-384c2bfad206	Psoriasis	Chronic autoimmune skin condition with scaly plaques	2026-08-29 07:03:34.97	2026-08-29 07:03:34.97	\N	\N	\N	L40.9	ACTIVE
d469bc70-3743-44c1-88fe-459ad1268172	Fungal Skin Infection	Superficial mycosis of the skin	2026-08-29 07:03:34.97	2026-08-29 07:03:34.97	\N	\N	\N	B98.4	ACTIVE
832846e8-fb56-44e1-89c0-97da901dff3f	Urticaria	Hives — allergic wheal-and-flare reaction	2026-08-29 07:03:34.97	2026-08-29 07:03:34.97	\N	\N	\N	L50.9	ACTIVE
6a827845-6041-48d4-98ba-4b7b19913107	Alopecia Areata	Patchy hair loss of autoimmune origin	2026-08-29 07:03:34.971	2026-08-29 07:03:34.971	\N	\N	\N	L63.9	ACTIVE
9ce9a59b-51d5-43c4-970c-dc71ddcfe032	Vitiligo	Depigmented macules due to melanocyte destruction	2026-08-29 07:03:34.971	2026-08-29 07:03:34.971	\N	\N	\N	L80	ACTIVE
70c5c498-4133-4ee0-9257-975a0e773200	Impetigo	Contagious superficial bacterial skin infection	2026-08-29 07:03:34.971	2026-08-29 07:03:34.971	\N	\N	\N	L01.0	ACTIVE
387e70cb-4fd6-4aed-8515-03a9cb8b7199	Tinea Corporis (Ringworm)	Dermatophyte infection of the body	2026-08-29 07:03:34.972	2026-08-29 07:03:34.972	\N	\N	\N	B35.4	ACTIVE
b405af92-9f15-4d77-b707-d05f286a4394	Allergic Rhinitis	Seasonal or perennial allergic nasal congestion	2026-08-29 07:03:34.972	2026-08-29 07:03:34.972	\N	\N	\N	J30.4	ACTIVE
e6723e44-ee70-4738-baa3-0488d95b160d	Chronic Sinusitis	Prolonged inflammation of the paranasal sinuses	2026-08-29 07:03:34.972	2026-08-29 07:03:34.972	\N	\N	\N	J32.9	ACTIVE
d46ba027-8244-4170-8460-d5b032e5979a	Tonsillitis	Acute inflammation of the palatine tonsils	2026-08-29 07:03:34.973	2026-08-29 07:03:34.973	\N	\N	\N	J03.9	ACTIVE
37e36bec-47f5-47f6-9133-076bbb58bd82	Hearing Loss - Sensorineural	Hearing loss due to inner ear or auditory nerve dysfunction	2026-08-29 07:03:34.973	2026-08-29 07:03:34.973	\N	\N	\N	H91.9	ACTIVE
d39918f8-d7d2-4823-9742-541ba6dae268	Vertigo / Labyrinthitis	Disorder of vestibular function with sensation of rotation	2026-08-29 07:03:34.973	2026-08-29 07:03:34.973	\N	\N	\N	H81.9	ACTIVE
d169dc54-9423-427a-8435-c729b1a84ef3	Nasal Polyp	Benign mucosal growth in the nasal cavity	2026-08-29 07:03:34.973	2026-08-29 07:03:34.973	\N	\N	\N	J33.9	ACTIVE
5f4c3b04-f42a-4fec-bdcf-a0af97401a1c	Deviated Nasal Septum	Displacement of the nasal septum causing obstruction	2026-08-29 07:03:34.974	2026-08-29 07:03:34.974	\N	\N	\N	J34.2	ACTIVE
d0e399bd-f008-4717-a43f-d5ae294bf6e4	Otosclerosis	Abnormal bone growth in the middle ear causing conductive hearing loss	2026-08-29 07:03:34.974	2026-08-29 07:03:34.974	\N	\N	\N	H80.9	ACTIVE
46835cda-64e4-46e3-8026-96f30ac3eb17	Cataract	Lens opacity impairing vision	2026-08-29 07:03:34.974	2026-08-29 07:03:34.974	\N	\N	\N	H26.9	ACTIVE
4afc6138-cce0-4137-91d3-50d646e5b19e	Conjunctivitis	Inflammation of the conjunctiva — infectious or allergic	2026-08-29 07:03:34.975	2026-08-29 07:03:34.975	\N	\N	\N	H10.9	ACTIVE
208e1711-0d94-4c06-89c0-a47f5355763a	Glaucoma	Optic neuropathy with characteristic visual field loss	2026-08-29 07:03:34.975	2026-08-29 07:03:34.975	\N	\N	\N	H40.9	ACTIVE
95011665-d862-4721-8b30-39cbf3dc7390	Refractive Error	Unspecified refractive error — myopia, hyperopia, or astigmatism	2026-08-29 07:03:34.975	2026-08-29 07:03:34.975	\N	\N	\N	H52.7	ACTIVE
b38c0fa2-b8d4-4afe-9a66-4c853ab97ccc	Dry Eye Syndrome	Keratoconjunctivitis sicca — deficient tear production or quality	2026-08-29 07:03:34.976	2026-08-29 07:03:34.976	\N	\N	\N	H04.12	ACTIVE
13f71287-c883-48b4-9049-f356a411011f	Diabetic Retinopathy	Retinal microvascular complication of diabetes	2026-08-29 07:03:34.976	2026-08-29 07:03:34.976	\N	\N	\N	E11.3	ACTIVE
bf065e0d-c52d-4b00-958a-c556cdb2097f	Stye / Hordeolum	Acute infection of the eyelid gland	2026-08-29 07:03:34.976	2026-08-29 07:03:34.976	\N	\N	\N	H00.0	ACTIVE
f0ae9efa-0a4f-492e-823e-22685213ccbb	Cerebrovascular Accident (Stroke)	Acute neurological deficit due to vascular cause	2026-08-29 07:03:34.977	2026-08-29 07:03:34.977	\N	\N	\N	I64	ACTIVE
481cccc2-5a06-4742-af34-92aca6e068b7	Epilepsy	Recurrent unprovoked seizures of unspecified type	2026-08-29 07:03:34.977	2026-08-29 07:03:34.977	\N	\N	\N	G40.9	ACTIVE
1c8cd403-ceec-4cef-88f1-a70034b57408	Parkinson Disease	Progressive neurodegenerative disorder with tremor, rigidity, bradykinesia	2026-08-29 07:03:34.977	2026-08-29 07:03:34.977	\N	\N	\N	G20	ACTIVE
dda49213-6db0-47a1-92cc-baef79d4c499	Peripheral Neuropathy	Damage to peripheral nerves of unspecified cause	2026-08-29 07:03:34.977	2026-08-29 07:03:34.977	\N	\N	\N	G62.9	ACTIVE
1270233b-1878-40c1-9aeb-913df0d22690	Bell Palsy	Acute unilateral facial nerve paralysis of unknown cause	2026-08-29 07:03:34.978	2026-08-29 07:03:34.978	\N	\N	\N	G51.0	ACTIVE
89d107b8-7630-4fad-9410-151f1f066640	Sciatica	Pain radiating along the sciatic nerve from lumbar spine to leg	2026-08-29 07:03:34.978	2026-08-29 07:03:34.978	\N	\N	\N	M54.3	ACTIVE
1c65310b-af0f-4ab1-a0d0-dd8a79c67079	Multiple Sclerosis	Chronic demyelinating disease of the central nervous system	2026-08-29 07:03:34.978	2026-08-29 07:03:34.978	\N	\N	\N	G35	ACTIVE
5c145889-6779-4d61-a682-24ccbe1074e8	Trigeminal Neuralgia	Paroxysmal severe facial pain along trigeminal nerve distribution	2026-08-29 07:03:34.979	2026-08-29 07:03:34.979	\N	\N	\N	G50.0	ACTIVE
f10d76df-c303-4a76-b45e-2b075f19372b	Generalized Anxiety Disorder	Persistent excessive worry and anxiety about multiple domains	2026-08-29 07:03:34.979	2026-08-29 07:03:34.979	\N	\N	\N	F41.1	ACTIVE
c93f4e00-cc4f-437c-9709-7c7aad74512b	Major Depressive Disorder	Single or recurrent major depressive episode of unspecified severity	2026-08-29 07:03:34.979	2026-08-29 07:03:34.979	\N	\N	\N	F32.9	ACTIVE
7236d117-92bf-4322-a937-aaf076d1c13c	Panic Disorder	Recurrent unexpected panic attacks with fear of future attacks	2026-08-29 07:03:34.98	2026-08-29 07:03:34.98	\N	\N	\N	F41.0	ACTIVE
6e69ee4c-ddef-42c7-9f88-7743b7c45fa5	Bipolar Affective Disorder	Manic-depressive illness of unspecified polarity or pattern	2026-08-29 07:03:34.98	2026-08-29 07:03:34.98	\N	\N	\N	F31.9	ACTIVE
dec3c674-05a4-401d-92e3-388994f8c1fb	Schizophrenia	Chronic psychotic disorder with hallucinations, delusions, cognitive impairment	2026-08-29 07:03:34.98	2026-08-29 07:03:34.98	\N	\N	\N	F20.9	ACTIVE
06643e1f-dcb0-4dc7-b9fe-44eebdb19cfb	Obsessive Compulsive Disorder	Recurrent obsessions and/or compulsions causing distress	2026-08-29 07:03:34.981	2026-08-29 07:03:34.981	\N	\N	\N	F42	ACTIVE
5c90d6b7-212d-4b25-8333-02d5737397e0	ADHD - Attention Deficit	Inattentive and/or hyperactive-impulsive behavioral pattern	2026-08-29 07:03:34.981	2026-08-29 07:03:34.981	\N	\N	\N	F90.0	ACTIVE
79dc4416-6b4a-4143-b5b9-6b09879117c7	Post Traumatic Stress Disorder	Prolonged distress after exposure to traumatic event	2026-08-29 07:03:34.981	2026-08-29 07:03:34.981	\N	\N	\N	F43.1	ACTIVE
1eb53b52-8c51-4103-8528-295813c1d48b	Alcohol Dependence Syndrome	Alcohol use disorder with dependence (chronic alcoholism)	2026-08-29 07:03:34.981	2026-08-29 07:03:34.981	\N	\N	\N	F10.2	ACTIVE
d8af1f97-b6f8-49d9-a7df-ded75d868120	Somatic Symptom Disorder	Physical symptoms with disproportionate thoughts and distress	2026-08-29 07:03:34.982	2026-08-29 07:03:34.982	\N	\N	\N	F45.0	ACTIVE
\.


--
-- Data for Name: DiagnosisSystem; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."DiagnosisSystem" (id, code, name, version, status, "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
8b77bb27-d01c-4d5e-841b-bc238bd86af9	ICD10	International Classification of Diseases	10th Revision	ACTIVE	2026-08-29 07:03:34.936	2026-08-29 07:03:34.936	\N	\N
59e6711f-5c78-4407-af9a-5f17a712da0c	ICD11	International Classification of Diseases	11th Revision	ACTIVE	2026-08-29 07:03:34.938	2026-08-29 07:03:34.938	\N	\N
3bb240de-181b-41d0-aead-ba2ff4728401	SNOMED	SNOMED CT	2024-09	ACTIVE	2026-08-29 07:03:34.939	2026-08-29 07:03:34.939	\N	\N
5beef632-0ec1-4414-bea7-235654913c9f	ICPC2	International Classification of Primary Care	2	ACTIVE	2026-08-29 07:03:34.94	2026-08-29 07:03:34.94	\N	\N
\.


--
-- Data for Name: Dispensing; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Dispensing" (id, "prescriptionId", "medicineId", "medicineName", quantity, "batchNo", "expiryDate", notes, "dispensedAt", "dispensedBy", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
1428cf5b-1ca9-421d-9fec-a57d857c4592	9050d7b0-c985-4314-b077-e6ff998381e3	c7b9a1bd-f58c-4a30-aaaf-da33c945cdb0	Amoxicillin	1	BATCH-5916	2027-03-05 07:05:12.923	\N	2026-08-22 07:03:35.279	Pharmacy	2026-08-29 07:05:12.924	2026-08-29 07:05:12.924	\N	\N
bd7b006c-b07e-48eb-aed5-0e461af62d17	9050d7b0-c985-4314-b077-e6ff998381e3	97ef1746-8c11-4c1d-934d-87f87ae00a9d	Cetirizine	1	BATCH-7934	2027-09-12 07:05:12.924	\N	2026-08-22 07:03:35.279	Pharmacy	2026-08-29 07:05:12.925	2026-08-29 07:05:12.925	\N	\N
23015088-0d57-4fa3-b2fe-a91489f6b89b	f6f677d6-6e42-4abc-91d7-0e83ae8b82bc	f5b3d68d-52bd-441b-8015-7b5f640692a7	Vitamin D3	1	BATCH-7337	2027-05-08 07:05:12.925	\N	2026-07-30 07:03:35.28	Pharmacy	2026-08-29 07:05:12.925	2026-08-29 07:05:12.925	\N	\N
62a395ff-20fc-4a4e-8282-1090100b8855	772553ab-ef90-4e2a-a805-d4a4fb9d094b	5806b756-c61e-4a51-85a1-ff29622cf90a	Atorvastatin	3	BATCH-2484	2027-09-15 07:05:12.925	\N	2026-07-30 07:03:35.284	Pharmacy	2026-08-29 07:05:12.925	2026-08-29 07:05:12.925	\N	\N
7da02121-a026-4c4e-87a7-5527dd3ebb3e	c7cc2e73-f532-4470-8a8d-29d6d9c40b59	6749db69-2a1c-4cf4-ab51-39937c97a707	Iron + Folic Acid	2	BATCH-8283	2027-04-13 07:05:12.925	\N	2026-08-26 07:03:35.285	Pharmacy	2026-08-29 07:05:12.926	2026-08-29 07:05:12.926	\N	\N
7d556eb3-5640-412d-a32a-672e52c8bb57	c7cc2e73-f532-4470-8a8d-29d6d9c40b59	unknown	Vitamin C	2	BATCH-2997	2027-11-22 07:05:12.925	\N	2026-08-26 07:03:35.285	Pharmacy	2026-08-29 07:05:12.926	2026-08-29 07:05:12.926	\N	\N
e4932d7f-1208-4102-b0c3-dcc5826ff807	2e0cdbfe-13b5-436e-a9c1-523a81749e3f	72d0b002-986c-4204-a2b1-3878788e42ce	Oseltamivir	1	BATCH-9213	2026-12-26 07:05:12.926	\N	2026-08-27 07:03:35.289	Pharmacy	2026-08-29 07:05:12.926	2026-08-29 07:05:12.926	\N	\N
18d061f0-72f4-4d27-9989-a6418c301eac	2e0cdbfe-13b5-436e-a9c1-523a81749e3f	714fdcce-3a10-445d-bc4c-615a7cf20b89	Paracetamol	1	BATCH-8626	2027-09-05 07:05:12.926	\N	2026-08-27 07:03:35.289	Pharmacy	2026-08-29 07:05:12.927	2026-08-29 07:05:12.927	\N	\N
8fe7c343-70fb-4ba0-9f08-30bf7efd3fcb	0430805e-0bf9-42dd-8055-c87548f44a05	97fbf6a6-3c6e-4f60-a3e1-db990f5ee002	Salbutamol Inhaler	1	BATCH-6369	2027-02-04 07:05:12.926	\N	2026-08-24 07:03:35.29	Pharmacy	2026-08-29 07:05:12.927	2026-08-29 07:05:12.927	\N	\N
080b791f-ed8b-4153-97b1-c96fce660254	0430805e-0bf9-42dd-8055-c87548f44a05	c7b9a1bd-f58c-4a30-aaaf-da33c945cdb0	Amoxicillin	1	BATCH-5350	2026-12-02 07:05:12.927	\N	2026-08-24 07:03:35.29	Pharmacy	2026-08-29 07:05:12.927	2026-08-29 07:05:12.927	\N	\N
148464c3-597c-435f-9512-84864ab6cd1c	0430805e-0bf9-42dd-8055-c87548f44a05	083f23db-30d2-467f-9d8c-5ee05d02591d	Montelukast + Levocetirizine	1	BATCH-6134	2027-03-15 07:05:12.927	\N	2026-08-24 07:03:35.29	Pharmacy	2026-08-29 07:05:12.927	2026-08-29 07:05:12.927	\N	\N
\.


--
-- Data for Name: Doctor; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Doctor" (id, specialization, "isActive", "createdAt", "updatedAt", "consultationFee", "consultationMode", "degreeCertificateUrl", "governmentIdUrl", "medicalCouncil", "medicalRegistrationNo", qualification, "registrationCertificateUrl", "registrationYear", signature, "yearsOfExperience", "createdById", "updatedById") FROM stdin;
c95d58c6-c888-440e-8e4f-d84f4ea1487c	General Medicine	t	2026-08-29 07:03:35.019	2026-08-29 07:03:35.019	500	OFFLINE	\N	\N	\N	MCI-10001	MBBS, MD	\N	\N	\N	15	\N	\N
\.


--
-- Data for Name: DoctorDepartment; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."DoctorDepartment" (id, "doctorId", "departmentId", "createdAt", "createdById") FROM stdin;
\.


--
-- Data for Name: DoctorSpecialization; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."DoctorSpecialization" (id, "doctorId", "specializationId", "createdAt", "createdById") FROM stdin;
\.


--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Document" (id, "documentType", "fileName", "originalName", "mimeType", "fileSize", "filePath", caption, "isPrimary", "isActive", "documentableType", "documentableId", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: EmployeeSchedule; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."EmployeeSchedule" (id, "dayOfWeek", "startTime", "endTime", "shiftId", "employeeSchedulableType", "employeeSchedulableId", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
ae0f3b7d-2199-4b3e-a7c1-9f58901ced9f	0	09:00	17:00	\N	Doctor	c95d58c6-c888-440e-8e4f-d84f4ea1487c	2026-08-29 07:03:35.02	2026-08-29 07:03:35.02	\N	\N
aa4a4d89-a785-4be5-b0d5-ab84002cf1e4	1	09:00	17:00	\N	Doctor	c95d58c6-c888-440e-8e4f-d84f4ea1487c	2026-08-29 07:03:35.021	2026-08-29 07:03:35.021	\N	\N
20ce5736-2b5a-4a15-ab62-ff8f0d345196	2	09:00	17:00	\N	Doctor	c95d58c6-c888-440e-8e4f-d84f4ea1487c	2026-08-29 07:03:35.021	2026-08-29 07:03:35.021	\N	\N
38a976f5-83b8-4b2d-8d18-88342f189f62	3	09:00	17:00	\N	Doctor	c95d58c6-c888-440e-8e4f-d84f4ea1487c	2026-08-29 07:03:35.021	2026-08-29 07:03:35.021	\N	\N
8bb26cce-1ff1-4641-9329-f09b0e5fcc09	4	09:00	17:00	\N	Doctor	c95d58c6-c888-440e-8e4f-d84f4ea1487c	2026-08-29 07:03:35.022	2026-08-29 07:03:35.022	\N	\N
\.


--
-- Data for Name: FinancialYear; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."FinancialYear" (id, name, "startDate", "endDate", "isCurrent", "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
5c2d417e-be84-4bf4-953a-bcbdca4c3217	2025-26	2025-04-01 00:00:00	2026-03-31 23:59:59.999	f	t	2026-08-29 05:24:41.921	2026-08-29 05:24:41.971	0a17b2ce-2978-435b-8ba4-1507c16e9cee	\N
485d1d78-f08b-4639-9e25-f21297365ba4	2026-27	2026-04-01 00:00:00	2027-03-31 23:59:59.999	t	t	2026-08-29 05:24:41.971	2026-08-29 05:24:41.971	0a17b2ce-2978-435b-8ba4-1507c16e9cee	\N
\.


--
-- Data for Name: LabOrder; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."LabOrder" (id, "patientId", "doctorId", "testName", category, notes, status, result, "resultDate", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
b4effb7d-895b-4ab6-a7b8-1b1377d9db95	5ac94232-db70-4b26-9e05-a8608e17644c	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Fasting Blood Sugar	Biochemistry	\N	COMPLETED	126 mg/dL — Diabetic range	2026-07-30 07:05:12.915	2026-07-30 07:05:12.915	2026-08-29 07:05:12.915	\N	\N
737045fb-5902-4cfc-94e5-1bdb7b89a896	5ac94232-db70-4b26-9e05-a8608e17644c	c95d58c6-c888-440e-8e4f-d84f4ea1487c	HbA1c	Biochemistry	\N	ORDERED	\N	\N	2026-08-29 07:05:12.917	2026-08-29 07:05:12.917	\N	\N
bbcd89b2-1969-40ed-8ab9-738ba356ae97	c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	c95d58c6-c888-440e-8e4f-d84f4ea1487c	HbA1c	Biochemistry	\N	COMPLETED	6.8% — Prediabetic range	2026-08-24 07:05:12.917	2026-08-24 07:05:12.917	2026-08-29 07:05:12.918	\N	\N
a3cfea3a-b4ae-40e9-9f4c-2fcda180b565	cf464e01-ef63-46a4-b15a-5f12cd872ed6	c95d58c6-c888-440e-8e4f-d84f4ea1487c	HbA1c	Biochemistry	\N	COMPLETED	8.1% — Poor control	2026-08-27 07:05:12.917	2026-08-27 07:05:12.917	2026-08-29 07:05:12.918	\N	\N
05e0a1df-58ca-4541-8475-d08074e77119	07f04c7e-1255-4293-a2bf-2ea83fdabd05	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Fasting Blood Sugar	Biochemistry	\N	COMPLETED	142 mg/dL — Diabetic	2026-08-01 07:05:12.918	2026-08-01 07:05:12.918	2026-08-29 07:05:12.918	\N	\N
52a33cf6-0af4-4486-840f-a30dbc558750	07f04c7e-1255-4293-a2bf-2ea83fdabd05	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Lipid Profile	Biochemistry	\N	ORDERED	\N	\N	2026-08-29 07:05:12.918	2026-08-29 07:05:12.919	\N	\N
49ab2d7a-8b3f-46fb-8463-735fd1ba9fff	26bde02c-ef9a-48db-bd66-4d00c8761b1f	c95d58c6-c888-440e-8e4f-d84f4ea1487c	CBC	Hematology	\N	COMPLETED	WBC elevated — 14000. Viral.	2026-08-11 07:05:12.918	2026-08-11 07:05:12.918	2026-08-29 07:05:12.919	\N	\N
096a9a42-44f0-4e67-b454-cfc246bf6330	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Fasting Blood Sugar	Biochemistry	\N	COMPLETED	98 mg/dL — Normal	2026-07-20 07:05:12.919	2026-07-20 07:05:12.919	2026-08-29 07:05:12.919	\N	\N
89837ec8-8414-4e8c-a6b1-668bad3818ae	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Lipid Profile	Biochemistry	\N	COMPLETED	Total Chol 240. LDL 155.	2026-07-20 07:05:12.919	2026-07-20 07:05:12.919	2026-08-29 07:05:12.919	\N	\N
4eed8c6f-a67a-4872-92f7-c905b1a41bd6	ec2163c3-7cee-4b49-b59f-a1095c577801	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Thyroid Profile	Endocrinology	\N	COMPLETED	Normal. TSH 2.1.	2026-07-15 07:05:12.919	2026-07-15 07:05:12.919	2026-08-29 07:05:12.92	\N	\N
6e936f41-e6ab-4f34-a5af-101d47c0a3c9	d31220e9-dc44-4708-9bbc-324064cd129e	c95d58c6-c888-440e-8e4f-d84f4ea1487c	H. Pylori Test	Gastroenterology	\N	COMPLETED	Positive — triple therapy recommended.	2026-08-01 07:05:12.92	2026-08-01 07:05:12.92	2026-08-29 07:05:12.92	\N	\N
25fd880e-4e13-44f7-8d9c-3d091d6cd399	72cbbde0-7870-4579-bdf5-00960d1c6ad3	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Thyroid Profile	Endocrinology	\N	COMPLETED	TSH 8.2 — Elevated. Hypothyroid.	2026-07-28 07:05:12.92	2026-07-28 07:05:12.92	2026-08-29 07:05:12.92	\N	\N
\.


--
-- Data for Name: Medicine; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Medicine" (id, name, "genericName", "brandName", category, strength, unit, price, "isActive", "createdAt", "updatedAt", "createdById", "updatedById", alias, "currentStock", "groupId", "openingStock", "unitId") FROM stdin;
714fdcce-3a10-445d-bc4c-615a7cf20b89	Paracetamol	Paracetamol	Calpol	TABLET	500mg	tablet	2	t	2026-08-29 07:03:34.984	2026-08-29 07:03:34.984	\N	\N	\N	0.00	\N	0.00	\N
68ffa958-a7ff-4db0-ab6c-3045084c7275	Ibuprofen	Ibuprofen	Brufen	TABLET	400mg	tablet	3	t	2026-08-29 07:03:34.985	2026-08-29 07:03:34.985	\N	\N	\N	0.00	\N	0.00	\N
3a190ec5-9150-4a07-b7b9-cb94236f9246	Paracetamol Syrup	Paracetamol	Calpol	SYRUP	250mg/5ml	ml	60	t	2026-08-29 07:03:34.986	2026-08-29 07:03:34.986	\N	\N	\N	0.00	\N	0.00	\N
c7b9a1bd-f58c-4a30-aaaf-da33c945cdb0	Amoxicillin	Amoxicillin	Novamox	CAPSULE	500mg	capsule	8	t	2026-08-29 07:03:34.986	2026-08-29 07:03:34.986	\N	\N	\N	0.00	\N	0.00	\N
c1f4a9ef-e1ae-46c8-ae09-b185a65bba9f	Azithromycin	Azithromycin	Azithral	TABLET	500mg	tablet	15	t	2026-08-29 07:03:34.986	2026-08-29 07:03:34.986	\N	\N	\N	0.00	\N	0.00	\N
309b8012-3a59-45d9-8da8-5ec1cd444f6b	Cefixime	Cefixime	Cefaxime	TABLET	200mg	tablet	12	t	2026-08-29 07:03:34.987	2026-08-29 07:03:34.987	\N	\N	\N	0.00	\N	0.00	\N
75e19560-2c4a-422c-87c2-b48381debbe7	Levofloxacin	Levofloxacin	Levoflox	TABLET	500mg	tablet	15	t	2026-08-29 07:03:34.987	2026-08-29 07:03:34.987	\N	\N	\N	0.00	\N	0.00	\N
454f01e9-dd27-4598-bffb-883c35bba12c	Metronidazole	Metronidazole	Flagyl	TABLET	400mg	tablet	4	t	2026-08-29 07:03:34.988	2026-08-29 07:03:34.988	\N	\N	\N	0.00	\N	0.00	\N
1ea4ce0d-56ff-4510-8895-ad4f56ddfe46	Doxycycline	Doxycycline	Doxylin	CAPSULE	100mg	capsule	8	t	2026-08-29 07:03:34.988	2026-08-29 07:03:34.988	\N	\N	\N	0.00	\N	0.00	\N
648da3fa-4f47-40e1-bd3b-5161634c1761	Metformin	Metformin	Glyciphage	TABLET	500mg	tablet	3	t	2026-08-29 07:03:34.988	2026-08-29 07:03:34.988	\N	\N	\N	0.00	\N	0.00	\N
0e90efd9-22ef-477f-ab73-3995d402df81	Omeprazole	Omeprazole	Omez	CAPSULE	20mg	capsule	5	t	2026-08-29 07:03:34.989	2026-08-29 07:03:34.989	\N	\N	\N	0.00	\N	0.00	\N
a5a5b41b-6903-4c78-be98-0bcf9e826e6e	Pantoprazole	Pantoprazole	Pantop	TABLET	40mg	tablet	5	t	2026-08-29 07:03:34.989	2026-08-29 07:03:34.989	\N	\N	\N	0.00	\N	0.00	\N
97ef1746-8c11-4c1d-934d-87f87ae00a9d	Cetirizine	Cetirizine	Alerid	TABLET	10mg	tablet	2	t	2026-08-29 07:03:34.989	2026-08-29 07:03:34.989	\N	\N	\N	0.00	\N	0.00	\N
eb407531-f949-4f27-b6ed-a8a3cf981ecc	Levocetirizine	Levocetirizine	Levocet	TABLET	5mg	tablet	5	t	2026-08-29 07:03:34.99	2026-08-29 07:03:34.99	\N	\N	\N	0.00	\N	0.00	\N
26c1e363-48fa-4954-9984-f4a0dddb8eaf	Montelukast	Montelukast	Montair	TABLET	10mg	tablet	10	t	2026-08-29 07:03:34.99	2026-08-29 07:03:34.99	\N	\N	\N	0.00	\N	0.00	\N
9655e298-1b02-4d62-ba57-cba6b0a218a9	Vitamin B Complex	Vitamin B Complex	Becosules	CAPSULE	\N	capsule	8	t	2026-08-29 07:03:34.99	2026-08-29 07:03:34.99	\N	\N	\N	0.00	\N	0.00	\N
a9d003d5-9a18-4008-8eac-649e6ce45eae	Multivitamin	Multivitamin	Zincovit	TABLET	\N	tablet	6	t	2026-08-29 07:03:34.991	2026-08-29 07:03:34.991	\N	\N	\N	0.00	\N	0.00	\N
4d4d66b7-721d-44c3-9d1a-623c5d7648e1	Folic Acid	Folic Acid	Folic Acid	TABLET	5mg	tablet	2	t	2026-08-29 07:03:34.991	2026-08-29 07:03:34.991	\N	\N	\N	0.00	\N	0.00	\N
796afbc9-6881-4fc9-a871-183a1342cc61	Calcium + Vitamin D3	Calcium + Vitamin D3	Shelcal	TABLET	500mg+400IU	tablet	6	t	2026-08-29 07:03:34.992	2026-08-29 07:03:34.992	\N	\N	\N	0.00	\N	0.00	\N
a15b8aaa-13e0-4341-bb6a-1fe36fc7ef8d	Vitamin B12	Methylcobalamin	Neurobion Forte	TABLET	1500mcg	tablet	7	t	2026-08-29 07:03:34.992	2026-08-29 07:03:34.992	\N	\N	\N	0.00	\N	0.00	\N
f5b3d68d-52bd-441b-8015-7b5f640692a7	Vitamin D3	Cholecalciferol	D3-60K	CAPSULE	60K IU	capsule	15	t	2026-08-29 07:03:34.992	2026-08-29 07:03:34.992	\N	\N	\N	0.00	\N	0.00	\N
6749db69-2a1c-4cf4-ab51-39937c97a707	Iron + Folic Acid	Ferrous Sulphate + Folic Acid	Ferium XT	TABLET	\N	tablet	4	t	2026-08-29 07:03:34.993	2026-08-29 07:03:34.993	\N	\N	\N	0.00	\N	0.00	\N
5aae2f82-93b4-4e29-a669-f53103095a1e	Amlodipine	Amlodipine	Amlodac	TABLET	5mg	tablet	4	t	2026-08-29 07:03:34.993	2026-08-29 07:03:34.993	\N	\N	\N	0.00	\N	0.00	\N
8e9f80a1-f911-4d24-b8d9-467e12d951ad	Telmisartan	Telmisartan	Telma	TABLET	40mg	tablet	8	t	2026-08-29 07:03:34.993	2026-08-29 07:03:34.993	\N	\N	\N	0.00	\N	0.00	\N
5806b756-c61e-4a51-85a1-ff29622cf90a	Atorvastatin	Atorvastatin	Atorva	TABLET	10mg	tablet	7	t	2026-08-29 07:03:34.994	2026-08-29 07:03:34.994	\N	\N	\N	0.00	\N	0.00	\N
b55fa29d-9406-4634-be8a-8af48d1cb61c	Metoprolol	Metoprolol	Metolar	TABLET	25mg	tablet	5	t	2026-08-29 07:03:34.994	2026-08-29 07:03:34.994	\N	\N	\N	0.00	\N	0.00	\N
177cedd1-8174-4095-a0e6-954e55eb3ae5	Losartan	Losartan	Losar	TABLET	50mg	tablet	6	t	2026-08-29 07:03:34.995	2026-08-29 07:03:34.995	\N	\N	\N	0.00	\N	0.00	\N
ec3b7229-4268-42a6-9ab4-3def940b6c24	Ramipril	Ramipril	Rami ACE	TABLET	2.5mg	tablet	5	t	2026-08-29 07:03:34.995	2026-08-29 07:03:34.995	\N	\N	\N	0.00	\N	0.00	\N
8020558f-06af-49ad-b6aa-60d37ff80b1b	Enalapril	Enalapril	Enacard	TABLET	5mg	tablet	4	t	2026-08-29 07:03:34.996	2026-08-29 07:03:34.996	\N	\N	\N	0.00	\N	0.00	\N
50cd6981-3016-4135-a522-e723007e4608	Aspirin Low Dose	Aspirin	Ecotrin	TABLET	75mg	tablet	1	t	2026-08-29 07:03:34.996	2026-08-29 07:03:34.996	\N	\N	\N	0.00	\N	0.00	\N
4c445429-8edb-4e5d-b768-1e232f5ca1e3	Clopidogrel	Clopidogrel	Clopivas	TABLET	75mg	tablet	10	t	2026-08-29 07:03:34.996	2026-08-29 07:03:34.996	\N	\N	\N	0.00	\N	0.00	\N
c31c5aa1-a607-416b-ae77-3e359094110c	Nitroglycerin	Nitroglycerin	Angispan	TABLET	0.5mg	tablet	3	t	2026-08-29 07:03:34.997	2026-08-29 07:03:34.997	\N	\N	\N	0.00	\N	0.00	\N
f1edb340-0f31-495d-b510-165c24d2f76f	Furosemide	Furosemide	Lasix	TABLET	40mg	tablet	3	t	2026-08-29 07:03:34.997	2026-08-29 07:03:34.997	\N	\N	\N	0.00	\N	0.00	\N
e4d66791-cf2d-4358-ad69-62c386aca3d7	Spironolactone	Spironolactone	Spironex	TABLET	25mg	tablet	6	t	2026-08-29 07:03:34.997	2026-08-29 07:03:34.997	\N	\N	\N	0.00	\N	0.00	\N
6c06cf5d-b44e-4900-9030-d8a864ec418e	Digoxin	Digoxin	Lanoxin	TABLET	0.25mg	tablet	4	t	2026-08-29 07:03:34.998	2026-08-29 07:03:34.998	\N	\N	\N	0.00	\N	0.00	\N
6595cd70-8229-496e-a2fd-349d1241b384	Salbutamol	Salbutamol	Asthalin	TABLET	2mg	tablet	3	t	2026-08-29 07:03:34.998	2026-08-29 07:03:34.998	\N	\N	\N	0.00	\N	0.00	\N
97fbf6a6-3c6e-4f60-a3e1-db990f5ee002	Salbutamol Inhaler	Salbutamol	Asthalin HFA	INHALER	100mcg	puff	200	t	2026-08-29 07:03:34.998	2026-08-29 07:03:34.998	\N	\N	\N	0.00	\N	0.00	\N
ea3abe62-4587-41d9-b139-95f7658a84d7	Budesonide Inhaler	Budesonide	Budesonide HFA	INHALER	200mcg	puff	350	t	2026-08-29 07:03:34.999	2026-08-29 07:03:34.999	\N	\N	\N	0.00	\N	0.00	\N
0945adbd-77fd-4bb8-bcef-e112b59fd8d8	Salmeterol + Fluticasone	Salmeterol + Fluticasone	Seretide Accuhaler	INHALER	50/250mcg	puff	450	t	2026-08-29 07:03:34.999	2026-08-29 07:03:34.999	\N	\N	\N	0.00	\N	0.00	\N
083f23db-30d2-467f-9d8c-5ee05d02591d	Montelukast + Levocetirizine	Montelukast + Levocetirizine	Montair LC	TABLET	10mg+5mg	tablet	12	t	2026-08-29 07:03:34.999	2026-08-29 07:03:34.999	\N	\N	\N	0.00	\N	0.00	\N
25ba804f-71f3-45c9-8693-c2bd2ccd82cd	Ipratropium Inhaler	Ipratropium Bromide	Respontin	INHALER	20mcg	puff	300	t	2026-08-29 07:03:35	2026-08-29 07:03:35	\N	\N	\N	0.00	\N	0.00	\N
179fdb6f-3864-4e90-9a6b-b90bb28afc6e	Theophylline	Theophylline	Theo-Dur	TABLET	200mg	tablet	5	t	2026-08-29 07:03:35	2026-08-29 07:03:35	\N	\N	\N	0.00	\N	0.00	\N
159326de-e19d-4d93-8397-b241d0069535	Clotrimazole 1% Cream	Clotrimazole	Clotrimazole Cream	CREAM	1%	gm	50	t	2026-08-29 07:03:35.001	2026-08-29 07:03:35.001	\N	\N	\N	0.00	\N	0.00	\N
d2b1b6c8-5fb3-4d49-83d1-0c6f832902b9	Mometasone 0.1% Cream	Mometasone	Momecort	CREAM	0.1%	gm	80	t	2026-08-29 07:03:35.001	2026-08-29 07:03:35.001	\N	\N	\N	0.00	\N	0.00	\N
a586fc04-5f4e-428b-ac1e-f2905f3582c3	Fusidic Acid 2% Cream	Fusidic Acid	Fucyn	CREAM	2%	gm	100	t	2026-08-29 07:03:35.001	2026-08-29 07:03:35.001	\N	\N	\N	0.00	\N	0.00	\N
203e4e24-0c58-4224-964c-68a6730883bd	Mupirocin 2% Ointment	Mupirocin	Mupikem	CREAM	2%	gm	90	t	2026-08-29 07:03:35.002	2026-08-29 07:03:35.002	\N	\N	\N	0.00	\N	0.00	\N
6e7f76cb-1689-447a-8be0-14eb85d210eb	Betamethasone Cream	Betamethasone	Betnovate	CREAM	0.1%	gm	60	t	2026-08-29 07:03:35.002	2026-08-29 07:03:35.002	\N	\N	\N	0.00	\N	0.00	\N
e2c18fd2-ae45-438a-a384-00c03d28a082	Calamine Lotion	Calamine	Calamine Lotion	OTHER	8%	ml	50	t	2026-08-29 07:03:35.002	2026-08-29 07:03:35.002	\N	\N	\N	0.00	\N	0.00	\N
00b5308d-5733-45d4-96ad-1fbddc2bfed6	Isotretinoin	Isotretinoin	Isotroin	CAPSULE	10mg	capsule	25	t	2026-08-29 07:03:35.003	2026-08-29 07:03:35.003	\N	\N	\N	0.00	\N	0.00	\N
fd35dbfc-5945-415b-adda-80ec03810640	Moxifloxacin Eye Drops	Moxifloxacin	Moxiflox	DROPS	0.5%	ml	80	t	2026-08-29 07:03:35.003	2026-08-29 07:03:35.003	\N	\N	\N	0.00	\N	0.00	\N
3691f8fd-5be7-402f-a786-79f114bab8dd	Timolol Eye Drops	Timolol	Timolet	DROPS	0.5%	ml	90	t	2026-08-29 07:03:35.004	2026-08-29 07:03:35.004	\N	\N	\N	0.00	\N	0.00	\N
e83707c8-6662-4c7c-8a37-4884ef593917	Ofloxacin Ear Drops	Ofloxacin	Oflox	DROPS	0.3%	ml	70	t	2026-08-29 07:03:35.004	2026-08-29 07:03:35.004	\N	\N	\N	0.00	\N	0.00	\N
4e694a91-babf-4f9f-ac15-212c93635a76	Artificial Tears	Carboxymethylcellulose	Refresh Tears	DROPS	\N	ml	120	t	2026-08-29 07:03:35.004	2026-08-29 07:03:35.004	\N	\N	\N	0.00	\N	0.00	\N
52ea2469-6e50-4519-97d5-0e36f9e3ac77	Diclofenac	Diclofenac Sodium	Voveran	TABLET	50mg	tablet	3	t	2026-08-29 07:03:35.005	2026-08-29 07:03:35.005	\N	\N	\N	0.00	\N	0.00	\N
9f37c2c9-eec2-4d25-b54d-cff0fb18d86c	Naproxen	Naproxen	Naprosyn	TABLET	250mg	tablet	6	t	2026-08-29 07:03:35.005	2026-08-29 07:03:35.005	\N	\N	\N	0.00	\N	0.00	\N
873a471f-9520-40b4-b7bb-0280d2dbb33f	Tramadol	Tramadol	Ultracet	CAPSULE	50mg	capsule	10	t	2026-08-29 07:03:35.005	2026-08-29 07:03:35.005	\N	\N	\N	0.00	\N	0.00	\N
02a2ef3d-b7b4-4faa-a6c7-0ab4426e053f	Pregabalin	Pregabalin	Pregalin	CAPSULE	75mg	capsule	15	t	2026-08-29 07:03:35.006	2026-08-29 07:03:35.006	\N	\N	\N	0.00	\N	0.00	\N
1c902600-9b74-40c0-b24b-727b91a77392	Gabapentin	Gabapentin	Gabantin	CAPSULE	300mg	capsule	12	t	2026-08-29 07:03:35.006	2026-08-29 07:03:35.006	\N	\N	\N	0.00	\N	0.00	\N
e0189e4b-2eb1-4040-b895-b70d25678c99	Domperidone	Domperidone	Domstal	TABLET	10mg	tablet	5	t	2026-08-29 07:03:35.007	2026-08-29 07:03:35.007	\N	\N	\N	0.00	\N	0.00	\N
c4472013-92e3-4fcc-a3be-acec8a6277d1	Ondansetron	Ondansetron	Emeset	TABLET	4mg	tablet	6	t	2026-08-29 07:03:35.007	2026-08-29 07:03:35.007	\N	\N	\N	0.00	\N	0.00	\N
c96c8d73-a65d-478c-9867-434c508aa207	Ranitidine	Ranitidine	Rantac	TABLET	150mg	tablet	3	t	2026-08-29 07:03:35.007	2026-08-29 07:03:35.007	\N	\N	\N	0.00	\N	0.00	\N
022c8d0d-4891-425e-8619-97a24df6563f	Loperamide	Loperamide	Imodium	CAPSULE	2mg	capsule	5	t	2026-08-29 07:03:35.008	2026-08-29 07:03:35.008	\N	\N	\N	0.00	\N	0.00	\N
4a7c03d9-6c06-492c-a442-d7e5fd5db02a	Mesalamine	Mesalamine	Mesacol	TABLET	400mg	tablet	18	t	2026-08-29 07:03:35.008	2026-08-29 07:03:35.008	\N	\N	\N	0.00	\N	0.00	\N
dfaae434-55ce-42fc-a007-401b469d1124	Escitalopram	Escitalopram	Nexito	TABLET	10mg	tablet	10	t	2026-08-29 07:03:35.008	2026-08-29 07:03:35.008	\N	\N	\N	0.00	\N	0.00	\N
3b291ce3-cc07-4c2a-bc38-0c84b70e8d6b	Sertraline	Sertraline	Serlift	TABLET	50mg	tablet	12	t	2026-08-29 07:03:35.009	2026-08-29 07:03:35.009	\N	\N	\N	0.00	\N	0.00	\N
795b7d0b-4bc9-4c5e-902c-b17a1a9fc199	Clonazepam	Clonazepam	Clonapax	TABLET	0.5mg	tablet	6	t	2026-08-29 07:03:35.009	2026-08-29 07:03:35.009	\N	\N	\N	0.00	\N	0.00	\N
e767621e-bf20-4680-8da9-8d7aebb2ad3d	Diazepam	Diazepam	Valium	TABLET	5mg	tablet	4	t	2026-08-29 07:03:35.009	2026-08-29 07:03:35.009	\N	\N	\N	0.00	\N	0.00	\N
8e735be7-bda3-4c14-ad32-1e9dd4895aa0	Levetiracetam	Levetiracetam	Levepsy	TABLET	500mg	tablet	16	t	2026-08-29 07:03:35.01	2026-08-29 07:03:35.01	\N	\N	\N	0.00	\N	0.00	\N
60fb94e6-a96f-4dee-8512-4a817e710358	Carbamazepine	Carbamazepine	Tegrital	TABLET	200mg	tablet	8	t	2026-08-29 07:03:35.01	2026-08-29 07:03:35.01	\N	\N	\N	0.00	\N	0.00	\N
3ec26dc9-378b-45fe-bbde-9f0fea03039c	Levothyroxine	Levothyroxine	Thyronorm	TABLET	50mcg	tablet	3	t	2026-08-29 07:03:35.011	2026-08-29 07:03:35.011	\N	\N	\N	0.00	\N	0.00	\N
7cd5b836-0b67-44fb-b3e6-30411d58d1f1	Glimepiride	Glimepiride	Amaryl	TABLET	1mg	tablet	5	t	2026-08-29 07:03:35.011	2026-08-29 07:03:35.011	\N	\N	\N	0.00	\N	0.00	\N
af50ec8d-2dd3-40e9-a54c-76bdb70aa138	Metformin + Glimepiride	Metformin + Glimepiride	Glyciphage G1	TABLET	500mg+1mg	tablet	7	t	2026-08-29 07:03:35.011	2026-08-29 07:03:35.011	\N	\N	\N	0.00	\N	0.00	\N
8382ca27-bf92-4561-95b5-4d86d982f191	Insulin Regular	Insulin Regular	Actrapid	INJECTION	40IU/ml	ml	300	t	2026-08-29 07:03:35.012	2026-08-29 07:03:35.012	\N	\N	\N	0.00	\N	0.00	\N
f8bfc070-fea6-432b-ba4b-1adb581ddceb	Mefenamic Acid	Mefenamic Acid	Meftal	TABLET	500mg	tablet	5	t	2026-08-29 07:03:35.012	2026-08-29 07:03:35.012	\N	\N	\N	0.00	\N	0.00	\N
fc6e5d3b-26ed-4d44-a9e4-6d9642b32e04	Tranexamic Acid	Tranexamic Acid	Traxanet	TABLET	500mg	tablet	12	t	2026-08-29 07:03:35.012	2026-08-29 07:03:35.012	\N	\N	\N	0.00	\N	0.00	\N
5df8fede-b1ea-4c37-8eaf-d8d85db59c97	Clomiphene	Clomiphene Citrate	Fertomid	TABLET	50mg	tablet	25	t	2026-08-29 07:03:35.013	2026-08-29 07:03:35.013	\N	\N	\N	0.00	\N	0.00	\N
b0b719be-310e-4c93-b0d3-61a114c45f07	Progesterone	Progesterone	Susten	CAPSULE	200mg	capsule	30	t	2026-08-29 07:03:35.013	2026-08-29 07:03:35.013	\N	\N	\N	0.00	\N	0.00	\N
d0b0106c-9311-4c03-ad1e-e0b062c530f7	Dydrogesterone	Dydrogesterone	Duphaston	TABLET	10mg	tablet	22	t	2026-08-29 07:03:35.014	2026-08-29 07:03:35.014	\N	\N	\N	0.00	\N	0.00	\N
4d97fe33-3531-4242-951e-43fd00844d96	Albendazole	Albendazole	Zentel	TABLET	400mg	tablet	10	t	2026-08-29 07:03:35.014	2026-08-29 07:03:35.014	\N	\N	\N	0.00	\N	0.00	\N
30af2de0-a0df-43a6-a242-7c287e233ce8	ORS Powder	Oral Rehydration Salts	Electral	OTHER	\N	packet	15	t	2026-08-29 07:03:35.014	2026-08-29 07:03:35.014	\N	\N	\N	0.00	\N	0.00	\N
458129ec-6706-4a39-b8c3-4edbb82426bc	Vitamin D3 Drops	Cholecalciferol	D3 Drops	DROPS	400IU/drop	ml	80	t	2026-08-29 07:03:35.015	2026-08-29 07:03:35.015	\N	\N	\N	0.00	\N	0.00	\N
537de3e3-a15d-433d-9833-f91784a2244e	Multivitamin Drops	Multivitamin	Syrup	SYRUP	\N	ml	90	t	2026-08-29 07:03:35.015	2026-08-29 07:03:35.015	\N	\N	\N	0.00	\N	0.00	\N
8b443e4b-6852-4614-88a1-8f887dde078b	Zinc Syrup	Zinc Sulphate	Zinc Syrup	SYRUP	20mg/5ml	ml	70	t	2026-08-29 07:03:35.015	2026-08-29 07:03:35.015	\N	\N	\N	0.00	\N	0.00	\N
1e1d8c84-35a8-4072-b488-6528b0970054	Artesunate Injection	Artesunate	Artesunate	INJECTION	60mg	vial	60	t	2026-08-29 07:03:35.016	2026-08-29 07:03:35.016	\N	\N	\N	0.00	\N	0.00	\N
980b6fc2-d6ea-4521-8056-3e8a6e74efad	Chloroquine	Chloroquine	Lariago	TABLET	250mg	tablet	5	t	2026-08-29 07:03:35.016	2026-08-29 07:03:35.016	\N	\N	\N	0.00	\N	0.00	\N
72d0b002-986c-4204-a2b1-3878788e42ce	Oseltamivir	Oseltamivir	Tamiflu	CAPSULE	75mg	capsule	250	t	2026-08-29 07:03:35.016	2026-08-29 07:03:35.016	\N	\N	\N	0.00	\N	0.00	\N
d9aee802-9d21-44b1-a56b-d64c9cbcd1f3	Hydroxychloroquine	Hydroxychloroquine	HCQS	TABLET	200mg	tablet	8	t	2026-08-29 07:03:35.017	2026-08-29 07:03:35.017	\N	\N	\N	0.00	\N	0.00	\N
29e2fe95-911a-4ae2-83c2-b07b47afe361	Acyclovir	Acyclovir	Acyclovir	TABLET	200mg	tablet	10	t	2026-08-29 07:03:35.017	2026-08-29 07:03:35.017	\N	\N	\N	0.00	\N	0.00	\N
\.


--
-- Data for Name: MedicineGroup; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."MedicineGroup" (id, name, description, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: Organisation; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Organisation" (id, name, address, phone, email, website, "registrationNumber", "createdAt", "updatedAt", "registrationFee", "discountEnabled", "maxDiscountPercent", "defaultDiscountType", "createdById", "updatedById") FROM stdin;
00000000-0000-0000-0000-000000000001	City Clinic — OPD	123 Health Avenue, Medical District	022-25551234	info@cityclinic.com	https://cityclinic.com	REG-MH-2024-0001	2026-08-29 07:03:34.902	2026-08-29 07:03:34.902	100	t	50	percent	\N	\N
\.


--
-- Data for Name: Patient; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Patient" (id, "contactNo", email, "dateOfBirth", gender, "bloodGroup", address, "emergencyContact", allergies, "createdAt", "updatedAt", "isFollowUp", "isActive", "createdById", "updatedById", "patientCode", "firstName", "middleName", "lastName", "altContactNo", "bloodGroupId") FROM stdin;
e64187e8-6e3e-48f3-b861-6cbf1cad2edd	9876543210	ravi.sharma@example.com	1992-06-15 00:00:00	Male	O+	42 Lake View Apartments, MG Road, Delhi	9876543211	{Pollen,Dust}	2026-08-29 07:03:35.226	2026-08-29 07:03:35.226	t	t	\N	\N	RAVIKSHARMA-19920615	Ravi	Kumar	Sharma	\N	\N
cc3bcd05-b213-4214-b947-f2c6b2d2dae4	9876543212	sunita.sharma@example.com	1955-11-20 00:00:00	Female	B+	12A Sunrise Colony, Sector 7, Noida	9876543213	{Aspirin,Penicillin}	2026-08-29 07:03:35.23	2026-08-29 07:03:35.23	t	t	\N	\N	SUNITADEVI-19551120	Sunita	Devi	Sharma	\N	\N
2cdbcde7-5f63-4f7d-8cc1-821e027ac0c3	9876543214	\N	2023-08-02 00:00:00	Male	A+	7/22 Green Park, East Wing, Mumbai	9876543215	{Milk,Eggs}	2026-08-29 07:03:35.231	2026-08-29 07:03:35.231	f	t	\N	\N	AARAVMEHTA-20230802	Aarav	\N	Mehta	\N	\N
4e9d8f18-0b92-4c6a-9dee-bece4ed31b72	9876543216	priya.patel@example.com	1988-03-10 00:00:00	Female	AB+	55 Lake Gardens, B Block, Bangalore	9876543217	{Sulfa,Dust}	2026-08-29 07:03:35.232	2026-08-29 07:03:35.232	f	t	\N	\N	PRIYAANAND-19880310	Priya	Anand	Patel	\N	\N
a429815d-b625-4b24-b689-bb5d878e4297	9876543218	abdul.khan@example.com	1962-12-05 00:00:00	Male	O-	33 Hill Road, Near Mosque, Hyderabad	9876543219	{Codeine}	2026-08-29 07:03:35.234	2026-08-29 07:03:35.234	t	t	\N	\N	ABDULRAHMAN-19621205	Abdul	Rahman	Khan	\N	\N
25104f0d-fa52-430c-aea0-b720d50f4831	9876543220	ananya.iyer@example.com	1995-07-22 00:00:00	Female	A-	8 Park Street, Adyar, Chennai	9876543221	{Peanuts,Shellfish}	2026-08-29 07:03:35.235	2026-08-29 07:03:35.235	f	t	\N	\N	ANANYALAKSHMI-19950722	Ananya	Lakshmi	Iyer	\N	\N
339d05de-a730-4301-adf1-89b263291ec3	9876543222	vikram.singh@example.com	1980-03-15 00:00:00	Male	B-	15 Rajouri Garden, Block C, New Delhi	9876543223	{"Bee Sting",Latex}	2026-08-29 07:03:35.236	2026-08-29 07:03:35.236	t	t	\N	\N	VIKRAMSINGH-19800315	Vikram	\N	Singh	\N	\N
5ac94232-db70-4b26-9e05-a8608e17644c	9876543224	lakshmi.nair@example.com	1975-09-12 00:00:00	Female	O+	23 MG Road, Ernakulam, Kochi	9876543225	{Soy,Wheat}	2026-08-29 07:03:35.237	2026-08-29 07:03:35.237	t	t	\N	\N	LAKSHMIPRIYA-19750912	Lakshmi	Priya	Nair	\N	\N
156e8a3c-bb9e-4b1a-b441-b8f90ac13cba	9876543226	arjun.kapoor@example.com	2001-05-18 00:00:00	Male	AB-	9 Jubilee Hills, Hyderabad	9876543227	{}	2026-08-29 07:03:35.238	2026-08-29 07:03:35.238	f	t	\N	\N	ARJUNREDDY-20010518	Arjun	Reddy	Kapoor	\N	\N
7613fa7a-5862-4f51-b66a-f8ea678366a7	9876543228	fatima.sheikh@example.com	1968-02-28 00:00:00	Female	B+	31 Chowringhee Lane, Kolkata	9876543229	{Iodine}	2026-08-29 07:03:35.239	2026-08-29 07:03:35.239	t	t	\N	\N	FATIMABEGUM-19680228	Fatima	Begum	Sheikh	\N	\N
28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	9876543230	meena.agarwal@example.com	1978-04-12 00:00:00	Female	A+	45 Residency Road, Jaipur, Rajasthan	9876543231	{Penicillin,Sulfa}	2026-08-29 07:03:35.241	2026-08-29 07:03:35.241	t	t	\N	\N	MEENAKUMARI-19780412	Meena	Kumari	Agarwal	\N	\N
c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	9876543232	suresh.babu@example.com	1965-08-19 00:00:00	Male	B+	78 T Nagar, Chennai, Tamil Nadu	9876543233	{Aspirin}	2026-08-29 07:03:35.242	2026-08-29 07:03:35.242	t	t	\N	\N	SURESHBABU-19650819	Suresh	\N	Babu	\N	\N
a7484f05-7285-4b27-a0d5-bc777f06391b	9876543234	kavya.reddy@example.com	1998-03-05 00:00:00	Female	O+	22 Banjara Hills, Hyderabad	9876543235	{Ibuprofen}	2026-08-29 07:03:35.243	2026-08-29 07:03:35.243	f	t	\N	\N	KAVYAREDDY-19980305	Kavya	\N	Reddy	\N	\N
cf464e01-ef63-46a4-b15a-5f12cd872ed6	9876543236	rakesh.tiwari@example.com	1971-06-30 00:00:00	Male	AB+	112 Civil Lines, Lucknow, UP	9876543237	{Latex}	2026-08-29 07:03:35.244	2026-08-29 07:03:35.244	t	t	\N	\N	RAKESHTIWARI-19710630	Rakesh	\N	Tiwari	\N	\N
34cadfdf-d66c-45fa-8b9a-cdd8aa22b2ca	9876543238	pooja.singh@example.com	1994-09-18 00:00:00	Female	O-	33 Gomti Nagar, Lucknow, UP	9876543239	{}	2026-08-29 07:03:35.245	2026-08-29 07:03:35.245	t	t	\N	\N	POOJALATA-19940918	Pooja	Lata	Singh	\N	\N
67595c75-e99f-4f60-afc8-a46df858ba02	9876543240	arvind.patel@example.com	1986-02-14 00:00:00	Male	A-	99 SG Highway, Ahmedabad, Gujarat	9876543241	{Pollen}	2026-08-29 07:03:35.246	2026-08-29 07:03:35.246	f	t	\N	\N	ARVINDPATEL-19860214	Arvind	\N	Patel	\N	\N
cc1c801f-4411-4b3b-a5ec-884fec96a867	9876543242	\N	1956-03-25 00:00:00	Female	B-	8 Lake Market, Kolkata, WB	9876543243	{Iodine}	2026-08-29 07:03:35.247	2026-08-29 07:03:35.247	t	t	\N	\N	SHANTIDEVI-19560325	Shanti	\N	Devi	\N	\N
3759cb6d-c848-452c-9bf3-0fb7ebfcaea7	9876543244	irfan.m@example.com	2001-07-11 00:00:00	Male	O+	67 Dharavi Main Road, Mumbai	9876543245	{}	2026-08-29 07:03:35.248	2026-08-29 07:03:35.248	f	t	\N	\N	MOHAMMEDIRFAN-20010711	Mohammed	\N	Irfan	\N	\N
12f74868-1ade-4939-9c8f-3c270e37f144	9876543246	lakshmi.d@example.com	1972-05-20 00:00:00	Female	A+	15 Ameerpet, Hyderabad	9876543247	{Shellfish}	2026-08-29 07:03:35.249	2026-08-29 07:03:35.249	t	t	\N	\N	LAKSHMIDEVI-19720520	Lakshmi	\N	Devi	\N	\N
d9d158e8-e789-4557-bdb0-cfddc756f13e	9876543248	rajiv.menon@example.com	1991-01-27 00:00:00	Male	AB-	42 Vyttila, Ernakulam, Kochi	9876543249	{Codeine}	2026-08-29 07:03:35.25	2026-08-29 07:03:35.25	f	t	\N	\N	RAJIVMENON-19910127	Rajiv	\N	Menon	\N	\N
07f04c7e-1255-4293-a2bf-2ea83fdabd05	9876543250	anjum.b@example.com	1967-09-03 00:00:00	Female	B+	28 Moghbazar, Dhaka (residing in Delhi)	9876543251	{Milk,Soy}	2026-08-29 07:03:35.251	2026-08-29 07:03:35.251	t	t	\N	\N	ANJUMBEGUM-19670903	Anjum	\N	Begum	\N	\N
26bde02c-ef9a-48db-bd66-4d00c8761b1f	9876543252	deepak.verma@example.com	1983-04-15 00:00:00	Male	O-	56 Sector 15, Gurgaon, Haryana	9876543253	{Dust,Pollen}	2026-08-29 07:03:35.252	2026-08-29 07:03:35.252	t	t	\N	\N	DEEPAKVERMA-19830415	Deepak	\N	Verma	\N	\N
c2fcdec3-e0c5-4f8a-9760-f99103988000	9876543254	sunita.joshi@example.com	2000-06-12 00:00:00	Female	A+	18 Dehradun Road, Rishikesh, Uttarakhand	9876543255	{}	2026-08-29 07:03:35.253	2026-08-29 07:03:35.253	f	t	\N	\N	SUNITAJOSHI-20000612	Sunita	\N	Joshi	\N	\N
bd47230f-0b87-4425-a811-558564d21ace	9876543256	prakash.rao@example.com	1969-02-28 00:00:00	Male	B+	88 JP Nagar, Bangalore, Karnataka	9876543257	{Peanuts}	2026-08-29 07:03:35.254	2026-08-29 07:03:35.254	t	t	\N	\N	PRAKASHRAO-19690228	Prakash	\N	Rao	\N	\N
8cc03dd3-6369-4b4d-b112-cd00753f3d35	9876543258	nisha.agarwal@example.com	1996-08-18 00:00:00	Female	O+	7 Lajpat Nagar, New Delhi	9876543259	{Eggs,Wheat}	2026-08-29 07:03:35.255	2026-08-29 07:03:35.255	f	t	\N	\N	NISHAAGARWAL-19960818	Nisha	\N	Agarwal	\N	\N
fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	9876543260	vijay.malhotra@example.com	1977-10-09 00:00:00	Male	A-	102 Model Town, Amritsar, Punjab	9876543261	{"Bee Sting"}	2026-08-29 07:03:35.256	2026-08-29 07:03:35.256	t	t	\N	\N	VIJAYKUMAR-19771009	Vijay	Kumar	Malhotra	\N	\N
ec2163c3-7cee-4b49-b59f-a1095c577801	9876543262	chandrika.m@example.com	1982-09-17 00:00:00	Female	B+	61 Panampilly Nagar, Kochi, Kerala	9876543263	{Codeine,Ibuprofen}	2026-08-29 07:03:35.257	2026-08-29 07:03:35.257	t	t	\N	\N	CHANDRIKAMENON-19820917	Chandrika	\N	Menon	\N	\N
69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	9876543264	sanjay.patil@example.com	1974-05-10 00:00:00	Male	O+	44 FC Road, Pune, Maharashtra	9876543265	{Aspirin,Latex}	2026-08-29 07:03:35.259	2026-08-29 07:03:35.259	t	t	\N	\N	SANJAYPATIL-19740510	Sanjay	\N	Patil	\N	\N
b23a9c6f-46f1-47b4-9c46-bac503de6ee0	9876543266	divya.rao@example.com	1999-02-28 00:00:00	Female	A-	12 Koramangala, Bangalore, Karnataka	9876543267	{Shellfish}	2026-08-29 07:03:35.26	2026-08-29 07:03:35.26	f	t	\N	\N	DIVYAPRABHA-19990228	Divya	Prabha	Rao	\N	\N
f5736042-5ff0-43d9-9aaa-57d51b309f3b	9876543268	rajesh.yadav@example.com	1969-07-15 00:00:00	Male	B-	78 Hazratganj, Lucknow, UP	9876543269	{Peanuts}	2026-08-29 07:03:35.261	2026-08-29 07:03:35.261	t	t	\N	\N	RAJESHYADAV-19690715	Rajesh	\N	Yadav	\N	\N
ca70ab17-8137-4d7c-b893-2270fbdb66db	9876543270	aisha.khan@example.com	2003-12-01 00:00:00	Female	O-	23 MG Road, Indore, MP	9876543271	{Sulfa,Pollen}	2026-08-29 07:03:35.262	2026-08-29 07:03:35.262	f	t	\N	\N	AISHAKHAN-20031201	Aisha	\N	Khan	\N	\N
240c3b04-ac4a-4dd5-8ecd-6df0ed23ec5e	9876543272	gopal.iyer@example.com	1962-04-19 00:00:00	Male	AB+	9 T Nagar, Chennai, Tamil Nadu	9876543273	{}	2026-08-29 07:03:35.263	2026-08-29 07:03:35.263	t	t	\N	\N	GOPALKRISHNA-19620419	Gopal	Krishna	Iyer	\N	\N
56b164e9-3307-42ae-953e-fb2dd482de9f	9876543274	harpreet.s@example.com	1987-08-30 00:00:00	Male	A+	55 Sector 22, Chandigarh	9876543275	{Dust,Milk}	2026-08-29 07:03:35.264	2026-08-29 07:03:35.264	f	t	\N	\N	HARPREETSINGH-19870830	Harpreet	\N	Singh	\N	\N
d2de2be3-984c-4da4-a603-ff1db0cc4d8a	9876543276	shobha.d@example.com	1958-06-25 00:00:00	Female	B+	33 Vasant Kunj, New Delhi	9876543277	{Penicillin,Eggs}	2026-08-29 07:03:35.265	2026-08-29 07:03:35.265	t	t	\N	\N	SHOBHADEVI-19580625	Shobha	\N	Devi	\N	\N
e3bb3f77-c3cd-40f9-aa21-52782e0decdd	9876543278	aditya.s@example.com	2000-09-15 00:00:00	Male	O+	17 Malviya Nagar, Jaipur, Rajasthan	9876543279	{Latex}	2026-08-29 07:03:35.266	2026-08-29 07:03:35.266	f	t	\N	\N	ADITYASHARMA-20000915	Aditya	\N	Sharma	\N	\N
88c2590c-052e-4a03-983c-b7cc80bc52e7	9876543280	kamala.nair@example.com	1971-03-08 00:00:00	Female	AB-	48 MG Road, Thiruvananthapuram, Kerala	9876543281	{Soy,Wheat}	2026-08-29 07:03:35.267	2026-08-29 07:03:35.267	t	t	\N	\N	KAMALANAIR-19710308	Kamala	\N	Nair	\N	\N
d31220e9-dc44-4708-9bbc-324064cd129e	9876543282	manoj.t@example.com	1980-01-12 00:00:00	Male	B+	89 Mahatma Gandhi Road, Varanasi, UP	9876543283	{Iodine,Shellfish}	2026-08-29 07:03:35.268	2026-08-29 07:03:35.268	t	t	\N	\N	MANOJTRIPATHI-19800112	Manoj	\N	Tripathi	\N	\N
246f369f-9d32-493d-9ee5-c63ce6e54482	9876543284	rekha.joshi@example.com	1985-07-04 00:00:00	Female	A+	26 Somajiguda, Hyderabad, Telangana	9876543285	{"Bee Sting"}	2026-08-29 07:03:35.269	2026-08-29 07:03:35.269	f	t	\N	\N	REKHAJOSHI-19850704	Rekha	\N	Joshi	\N	\N
72cbbde0-7870-4579-bdf5-00960d1c6ad3	9876543286	vijay.patel@example.com	1976-03-22 00:00:00	Male	O-	37 CG Road, Ahmedabad, Gujarat	9876543287	{Penicillin}	2026-08-29 07:03:35.27	2026-08-29 07:03:35.27	t	t	\N	\N	VIJAYPATEL-19760322	Vijay	\N	Patel	\N	\N
235b535a-e400-486c-8cf4-340dcc3b57f4	9876543288	sunita.pandey@example.com	1993-05-18 00:00:00	Female	B-	19 Civil Lines, Allahabad, UP	9876543289	{}	2026-08-29 07:03:35.271	2026-08-29 07:03:35.271	f	t	\N	\N	SUNITAPANDEY-19930518	Sunita	\N	Pandey	\N	\N
8df03486-18de-4954-af40-f06edfa8b9d3	9876543290	ashok.gupta@example.com	1963-11-30 00:00:00	Male	A-	56 Lajpat Nagar, New Delhi	9876543291	{Aspirin,Codeine}	2026-08-29 07:03:35.272	2026-08-29 07:03:35.272	t	t	\N	\N	ASHOKGUPTA-19631130	Ashok	\N	Gupta	\N	\N
\.


--
-- Data for Name: PatientAllergy; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."PatientAllergy" (id, "patientId", "allergyId", notes, "severityOverride", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
e34d5386-1d62-4cd6-b5dd-aca7a1584c28	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	f3fdc318-8f7e-4a33-a9e1-9b898bddec1f	Seasonal — worse in monsoon	\N	2026-08-29 07:05:12.93	2026-08-29 07:05:12.93	\N	\N
b032aec1-9161-4911-9a30-31fbb675cfad	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	5825a366-e127-4ec1-b66b-dba72c0dcaec	Seasonal — worse in monsoon	\N	2026-08-29 07:05:12.932	2026-08-29 07:05:12.932	\N	\N
c52a992c-afa7-47fc-9094-52b1b728313d	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	a9f7e882-32fe-4fef-9e23-f69e824bff43	Severe reaction to penicillin — anaphylaxis history	\N	2026-08-29 07:05:12.932	2026-08-29 07:05:12.932	\N	\N
f63cb1bf-6d87-4a8b-a41a-948fd0d8bef8	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	ea4d587e-1fa9-4a2d-8943-7d310b6b4e2f	Severe reaction to penicillin — anaphylaxis history	\N	2026-08-29 07:05:12.932	2026-08-29 07:05:12.932	\N	\N
b239ad72-e364-4b01-abec-4f0e4f11e3da	2cdbcde7-5f63-4f7d-8cc1-821e027ac0c3	f412a851-dc44-4dd3-ae10-67860210ad2b	Pediatric food allergy — improving with age	\N	2026-08-29 07:05:12.933	2026-08-29 07:05:12.933	\N	\N
4481e5f3-6a88-4bc3-bda8-7922c394d3d9	2cdbcde7-5f63-4f7d-8cc1-821e027ac0c3	61b62a97-7f0d-4524-b3c1-7e626c55534e	Pediatric food allergy — improving with age	\N	2026-08-29 07:05:12.933	2026-08-29 07:05:12.933	\N	\N
8488158e-cd7f-4558-b0d7-ea27d42488a9	4e9d8f18-0b92-4c6a-9dee-bece4ed31b72	1c53630e-8b89-43cd-99de-a88f3b202f5e	Sulfa rash — confirmed on challenge	\N	2026-08-29 07:05:12.933	2026-08-29 07:05:12.933	\N	\N
2f3adecd-055f-4c9f-958e-7ac93f5cca01	4e9d8f18-0b92-4c6a-9dee-bece4ed31b72	5825a366-e127-4ec1-b66b-dba72c0dcaec	Sulfa rash — confirmed on challenge	\N	2026-08-29 07:05:12.933	2026-08-29 07:05:12.933	\N	\N
dd647caa-daa5-4c8a-837a-79bb00b2e2bc	a429815d-b625-4b24-b689-bb5d878e4297	a97fcdf4-8baf-4432-a9c5-b7e730e65cc5	Nausea and vomiting with codeine	\N	2026-08-29 07:05:12.934	2026-08-29 07:05:12.934	\N	\N
908683d8-b0a3-4d7f-af4e-e4131ab22065	25104f0d-fa52-430c-aea0-b720d50f4831	88d4d732-44ff-444b-83cc-a6f4907a6e6b	Peanut allergy — carry EpiPen	\N	2026-08-29 07:05:12.934	2026-08-29 07:05:12.934	\N	\N
5e4e5090-f263-4b26-b92f-da52372b38ff	25104f0d-fa52-430c-aea0-b720d50f4831	c4112ffa-fef5-45b8-9460-0af6c6dc68fe	Peanut allergy — carry EpiPen	\N	2026-08-29 07:05:12.934	2026-08-29 07:05:12.934	\N	\N
e8d1585e-c122-48ed-b227-11732acab685	339d05de-a730-4301-adf1-89b263291ec3	d7b03548-dfb7-4582-bca7-cd0377371b8c	Bee sting — anaphylaxis. Latex — contact urticaria.	\N	2026-08-29 07:05:12.934	2026-08-29 07:05:12.934	\N	\N
e5d91233-7349-4049-9d95-ef906ba5b18a	339d05de-a730-4301-adf1-89b263291ec3	4c92c916-1b2e-404d-8541-f8c7d87fc21e	Bee sting — anaphylaxis. Latex — contact urticaria.	\N	2026-08-29 07:05:12.935	2026-08-29 07:05:12.935	\N	\N
47d6b31b-8f5a-465d-9d5c-61203d254508	5ac94232-db70-4b26-9e05-a8608e17644c	4b4eaf55-759d-438b-919b-0f5a2b3a886b	Gluten sensitivity confirmed	\N	2026-08-29 07:05:12.935	2026-08-29 07:05:12.935	\N	\N
ea7627e9-adcd-4806-889f-dcf44f95825b	5ac94232-db70-4b26-9e05-a8608e17644c	692c3831-2b2e-45d1-8d1f-354ad59b2327	Gluten sensitivity confirmed	\N	2026-08-29 07:05:12.935	2026-08-29 07:05:12.935	\N	\N
97d24b1d-56bf-41c7-a094-c7834fb0025f	7613fa7a-5862-4f51-b66a-f8ea678366a7	3cbc0876-5fe2-4980-b0ab-3296dd42c1c9	Contrast dye allergy — premedicate if needed	\N	2026-08-29 07:05:12.935	2026-08-29 07:05:12.935	\N	\N
0cc4e4af-daa2-4ec3-b89f-a953f96a6e41	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	ea4d587e-1fa9-4a2d-8943-7d310b6b4e2f	Penicillin — anaphylaxis history. Sulfa — rash.	\N	2026-08-29 07:05:12.936	2026-08-29 07:05:12.936	\N	\N
3bf014ed-1028-4c36-bcbc-5d8f33635ad9	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	1c53630e-8b89-43cd-99de-a88f3b202f5e	Penicillin — anaphylaxis history. Sulfa — rash.	\N	2026-08-29 07:05:12.936	2026-08-29 07:05:12.936	\N	\N
5c6af9cc-de1a-4f4b-a933-764e9fc60347	c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	a9f7e882-32fe-4fef-9e23-f69e824bff43	Aspirin-induced bronchospasm	\N	2026-08-29 07:05:12.936	2026-08-29 07:05:12.936	\N	\N
ba46d313-098b-4344-baa0-e74bb8140db5	a7484f05-7285-4b27-a0d5-bc777f06391b	fdc3d763-f213-42a3-b6ca-4a0beaba730b	GI upset with NSAIDs	\N	2026-08-29 07:05:12.936	2026-08-29 07:05:12.936	\N	\N
5c745ea7-3653-44af-b808-557b557f9d63	cf464e01-ef63-46a4-b15a-5f12cd872ed6	4c92c916-1b2e-404d-8541-f8c7d87fc21e	Contact dermatitis with latex gloves	\N	2026-08-29 07:05:12.937	2026-08-29 07:05:12.937	\N	\N
a860205f-5cfb-4cb7-bbc1-8734743b42ac	67595c75-e99f-4f60-afc8-a46df858ba02	f3fdc318-8f7e-4a33-a9e1-9b898bddec1f	Severe seasonal allergies	\N	2026-08-29 07:05:12.937	2026-08-29 07:05:12.937	\N	\N
d1a68bf2-a2d8-482a-b376-88add407b669	cc1c801f-4411-4b3b-a5ec-884fec96a867	3cbc0876-5fe2-4980-b0ab-3296dd42c1c9	Flushing with contrast dye	\N	2026-08-29 07:05:12.937	2026-08-29 07:05:12.937	\N	\N
d15a0348-cabb-47b7-b761-ff91fbb6fabe	12f74868-1ade-4939-9c8f-3c270e37f144	c4112ffa-fef5-45b8-9460-0af6c6dc68fe	Hives and cramps with shellfish	\N	2026-08-29 07:05:12.937	2026-08-29 07:05:12.937	\N	\N
0ad14c67-99ca-4a8b-8983-e98490a8b8ec	d9d158e8-e789-4557-bdb0-cfddc756f13e	a97fcdf4-8baf-4432-a9c5-b7e730e65cc5	Severe nausea with codeine	\N	2026-08-29 07:05:12.938	2026-08-29 07:05:12.938	\N	\N
a3c307cc-cb9b-4d6d-b734-d5620afddb7e	07f04c7e-1255-4293-a2bf-2ea83fdabd05	f412a851-dc44-4dd3-ae10-67860210ad2b	Dairy and soy intolerance	\N	2026-08-29 07:05:12.938	2026-08-29 07:05:12.938	\N	\N
2c270899-950a-42ab-b9a3-cd8b7c385f4f	07f04c7e-1255-4293-a2bf-2ea83fdabd05	4b4eaf55-759d-438b-919b-0f5a2b3a886b	Dairy and soy intolerance	\N	2026-08-29 07:05:12.938	2026-08-29 07:05:12.938	\N	\N
9e03b561-d1bd-4c22-bae3-af1187d02f95	26bde02c-ef9a-48db-bd66-4d00c8761b1f	5825a366-e127-4ec1-b66b-dba72c0dcaec	Environmental allergies — dust and pollen	\N	2026-08-29 07:05:12.938	2026-08-29 07:05:12.938	\N	\N
d5ce76bf-268f-4388-b616-fce9bceed464	26bde02c-ef9a-48db-bd66-4d00c8761b1f	f3fdc318-8f7e-4a33-a9e1-9b898bddec1f	Environmental allergies — dust and pollen	\N	2026-08-29 07:05:12.939	2026-08-29 07:05:12.939	\N	\N
28c98a1b-7901-4aae-9b4c-2b8dd79ec08b	bd47230f-0b87-4425-a811-558564d21ace	88d4d732-44ff-444b-83cc-a6f4907a6e6b	Peanut allergy — carry EpiPen	\N	2026-08-29 07:05:12.939	2026-08-29 07:05:12.939	\N	\N
2466a6cb-a9d0-41e9-be38-e590b8329880	8cc03dd3-6369-4b4d-b112-cd00753f3d35	61b62a97-7f0d-4524-b3c1-7e626c55534e	Egg and wheat sensitivity	\N	2026-08-29 07:05:12.939	2026-08-29 07:05:12.939	\N	\N
ee726a03-7eea-4b92-a558-51f77c1c9832	8cc03dd3-6369-4b4d-b112-cd00753f3d35	692c3831-2b2e-45d1-8d1f-354ad59b2327	Egg and wheat sensitivity	\N	2026-08-29 07:05:12.939	2026-08-29 07:05:12.939	\N	\N
45f37199-5ccd-4b24-80e1-a0b77dcf80c8	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	d7b03548-dfb7-4582-bca7-cd0377371b8c	Severe reaction to bee stings	\N	2026-08-29 07:05:12.94	2026-08-29 07:05:12.94	\N	\N
98a97267-198e-4a0c-8d3d-a575296a5c08	ec2163c3-7cee-4b49-b59f-a1095c577801	a97fcdf4-8baf-4432-a9c5-b7e730e65cc5	Codeine — nausea. Ibuprofen — GI bleeding.	\N	2026-08-29 07:05:12.94	2026-08-29 07:05:12.94	\N	\N
9f25f6f3-6b94-464a-90d4-cce8a6225ed8	ec2163c3-7cee-4b49-b59f-a1095c577801	fdc3d763-f213-42a3-b6ca-4a0beaba730b	Codeine — nausea. Ibuprofen — GI bleeding.	\N	2026-08-29 07:05:12.94	2026-08-29 07:05:12.94	\N	\N
8b989057-885d-4b5e-aca5-43a8e6c821b2	69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	a9f7e882-32fe-4fef-9e23-f69e824bff43	Aspirin — bronchospasm. Latex — contact dermatitis.	\N	2026-08-29 07:05:12.94	2026-08-29 07:05:12.94	\N	\N
1b462931-b275-4aef-a91a-bfdc5d4ecdf9	69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	4c92c916-1b2e-404d-8541-f8c7d87fc21e	Aspirin — bronchospasm. Latex — contact dermatitis.	\N	2026-08-29 07:05:12.941	2026-08-29 07:05:12.941	\N	\N
e15fa3e0-cb59-441a-8539-218081b191f9	b23a9c6f-46f1-47b4-9c46-bac503de6ee0	c4112ffa-fef5-45b8-9460-0af6c6dc68fe	Hives with shellfish	\N	2026-08-29 07:05:12.941	2026-08-29 07:05:12.941	\N	\N
5c4ae550-4eb7-4158-ac3d-58bbb7d6011d	f5736042-5ff0-43d9-9aaa-57d51b309f3b	88d4d732-44ff-444b-83cc-a6f4907a6e6b	Anaphylaxis risk	\N	2026-08-29 07:05:12.941	2026-08-29 07:05:12.941	\N	\N
786a0224-fcf3-4777-9eda-c1dadba5a113	ca70ab17-8137-4d7c-b893-2270fbdb66db	1c53630e-8b89-43cd-99de-a88f3b202f5e	Sulfa — rash. Pollen — seasonal.	\N	2026-08-29 07:05:12.942	2026-08-29 07:05:12.942	\N	\N
5f1a12d7-d418-487f-b72b-a271ae2f06ce	ca70ab17-8137-4d7c-b893-2270fbdb66db	f3fdc318-8f7e-4a33-a9e1-9b898bddec1f	Sulfa — rash. Pollen — seasonal.	\N	2026-08-29 07:05:12.942	2026-08-29 07:05:12.942	\N	\N
4d059336-3926-462b-bdcc-0cc9372b507b	56b164e9-3307-42ae-953e-fb2dd482de9f	5825a366-e127-4ec1-b66b-dba72c0dcaec	Dust — cough. Milk — bloating.	\N	2026-08-29 07:05:12.942	2026-08-29 07:05:12.942	\N	\N
1eeea4f4-8f33-4bc7-b547-8c009b55601a	56b164e9-3307-42ae-953e-fb2dd482de9f	f412a851-dc44-4dd3-ae10-67860210ad2b	Dust — cough. Milk — bloating.	\N	2026-08-29 07:05:12.942	2026-08-29 07:05:12.942	\N	\N
e0818b2f-f387-42f2-b808-6480b9ef7e66	d2de2be3-984c-4da4-a603-ff1db0cc4d8a	ea4d587e-1fa9-4a2d-8943-7d310b6b4e2f	Penicillin — anaphylaxis history. Eggs — urticaria.	\N	2026-08-29 07:05:12.943	2026-08-29 07:05:12.943	\N	\N
9305b8e4-2ae3-496e-84e1-badb117667b8	d2de2be3-984c-4da4-a603-ff1db0cc4d8a	61b62a97-7f0d-4524-b3c1-7e626c55534e	Penicillin — anaphylaxis history. Eggs — urticaria.	\N	2026-08-29 07:05:12.943	2026-08-29 07:05:12.943	\N	\N
4e39b512-0a51-4d3d-ad85-ea548fa36de6	e3bb3f77-c3cd-40f9-aa21-52782e0decdd	4c92c916-1b2e-404d-8541-f8c7d87fc21e	Contact urticaria	\N	2026-08-29 07:05:12.943	2026-08-29 07:05:12.943	\N	\N
7fc699a7-0384-4dfa-9466-49a5b30c4c2c	72cbbde0-7870-4579-bdf5-00960d1c6ad3	ea4d587e-1fa9-4a2d-8943-7d310b6b4e2f	Rash with penicillin	\N	2026-08-29 07:05:12.943	2026-08-29 07:05:12.943	\N	\N
a15fc3ed-ebd7-4aa3-bdb7-107efea5affc	8df03486-18de-4954-af40-f06edfa8b9d3	a9f7e882-32fe-4fef-9e23-f69e824bff43	Aspirin — GI upset. Codeine — nausea.	\N	2026-08-29 07:05:12.944	2026-08-29 07:05:12.944	\N	\N
a4bd9eba-2447-4434-9f96-188193939f7e	8df03486-18de-4954-af40-f06edfa8b9d3	a97fcdf4-8baf-4432-a9c5-b7e730e65cc5	Aspirin — GI upset. Codeine — nausea.	\N	2026-08-29 07:05:12.944	2026-08-29 07:05:12.944	\N	\N
\.


--
-- Data for Name: PatientAllergyRecord; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."PatientAllergyRecord" (id, "patientId", allergen, "allergyType", reaction, severity, status, notes, "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
f8ffa401-25fc-48c9-9842-bff2e9a40f18	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	Pollen	ENVIRONMENTAL	Sneezing, watery eyes, nasal congestion	MILD	ACTIVE	\N	2026-08-29 07:05:12.945	2026-08-29 07:05:12.945	\N	\N
040d3534-0672-442e-8575-27d915ec0a11	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	Dust	ENVIRONMENTAL	Coughing, throat irritation	MILD	ACTIVE	\N	2026-08-29 07:05:12.946	2026-08-29 07:05:12.946	\N	\N
1dc32d4d-9099-4e09-9189-38ca8107f939	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	Penicillin	DRUG	Anaphylaxis — hives, swelling, difficulty breathing	LIFE_THREATENING	ACTIVE	\N	2026-08-29 07:05:12.946	2026-08-29 07:05:12.946	\N	\N
b5633f61-6ad5-43f9-9bb7-9fd3f1038603	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	Aspirin	DRUG	Urticaria, bronchospasm	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.946	2026-08-29 07:05:12.946	\N	\N
1628820b-616b-4e22-9614-5c51eb1f2c78	2cdbcde7-5f63-4f7d-8cc1-821e027ac0c3	Milk	FOOD	Diaper rash, loose stools	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.946	2026-08-29 07:05:12.946	\N	\N
87f7c8a7-47c2-492b-92df-d22eb8d42f45	2cdbcde7-5f63-4f7d-8cc1-821e027ac0c3	Eggs	FOOD	Skin rash, mild vomiting	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.947	2026-08-29 07:05:12.947	\N	\N
627f14a9-e4fe-496f-97f5-8a1094bf1eb7	4e9d8f18-0b92-4c6a-9dee-bece4ed31b72	Sulfa	DRUG	Maculopapular rash, fever	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.947	2026-08-29 07:05:12.947	\N	\N
57a283b8-d73d-41dd-96f1-8e5736ae8880	a429815d-b625-4b24-b689-bb5d878e4297	Codeine	DRUG	Nausea, vomiting, dizziness	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.947	2026-08-29 07:05:12.947	\N	\N
99ca39d7-f4d2-4079-a1fc-7c86c365ceb4	25104f0d-fa52-430c-aea0-b720d50f4831	Peanuts	FOOD	Throat tightness, urticaria, vomiting	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.947	2026-08-29 07:05:12.947	\N	\N
fd1f8043-7fbc-4b7c-a80b-bb10cdf48617	25104f0d-fa52-430c-aea0-b720d50f4831	Shellfish	FOOD	Hives, facial swelling	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.948	2026-08-29 07:05:12.948	\N	\N
8e525cb4-de00-412c-824e-c2dc02604d5c	339d05de-a730-4301-adf1-89b263291ec3	Bee Sting	ENVIRONMENTAL	Anaphylaxis — hypotension, airway edema	LIFE_THREATENING	ACTIVE	\N	2026-08-29 07:05:12.948	2026-08-29 07:05:12.948	\N	\N
a68e3597-f245-4c97-b89f-7c0436000db9	339d05de-a730-4301-adf1-89b263291ec3	Latex	ENVIRONMENTAL	Contact urticaria, itching	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.948	2026-08-29 07:05:12.948	\N	\N
96e991ff-17a5-4a27-b0ac-4e5bb4308c4b	5ac94232-db70-4b26-9e05-a8608e17644c	Soy	FOOD	Bloating, abdominal discomfort	MILD	ACTIVE	\N	2026-08-29 07:05:12.949	2026-08-29 07:05:12.949	\N	\N
183183d3-1c66-4ac6-b1ca-9413848d613b	5ac94232-db70-4b26-9e05-a8608e17644c	Wheat	FOOD	Abdominal pain, diarrhea	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.949	2026-08-29 07:05:12.949	\N	\N
a6d0af5c-a3c0-4ca2-b875-7156443e8f0d	7613fa7a-5862-4f51-b66a-f8ea678366a7	Iodine	DRUG	Urticaria, flushing with contrast dye	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.949	2026-08-29 07:05:12.949	\N	\N
b35a18dc-3c99-4692-aa51-bfa9b02ed1da	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	Penicillin	DRUG	Hives, facial swelling	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.949	2026-08-29 07:05:12.949	\N	\N
c4e7858b-0f3e-452e-a45c-891f4d47eace	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	Sulfa	DRUG	Maculopapular rash	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.95	2026-08-29 07:05:12.95	\N	\N
1f77fbd5-f8d2-474d-82ec-28562f8057d7	c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	Aspirin	DRUG	Bronchospasm, wheezing	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.95	2026-08-29 07:05:12.95	\N	\N
e091fb7a-953b-44c2-bc6a-74fc70f8bf91	a7484f05-7285-4b27-a0d5-bc777f06391b	Ibuprofen	DRUG	GI upset, mild rash	MILD	ACTIVE	\N	2026-08-29 07:05:12.95	2026-08-29 07:05:12.95	\N	\N
1b206bb9-08ce-416f-97f0-15f657d7456f	cf464e01-ef63-46a4-b15a-5f12cd872ed6	Latex	ENVIRONMENTAL	Contact dermatitis	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.95	2026-08-29 07:05:12.95	\N	\N
3cde00ff-d2fd-4f25-a916-044ae1edd737	67595c75-e99f-4f60-afc8-a46df858ba02	Pollen	ENVIRONMENTAL	Severe rhinitis, eye itching	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.95	2026-08-29 07:05:12.95	\N	\N
09b526db-783e-44aa-b4e0-4296520548e6	cc1c801f-4411-4b3b-a5ec-884fec96a867	Iodine	DRUG	Flushing with povidone	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.951	2026-08-29 07:05:12.951	\N	\N
118df70b-1ac6-479f-b338-ea5a4a5e7bc6	12f74868-1ade-4939-9c8f-3c270e37f144	Shellfish	FOOD	Hives, abdominal cramps	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.951	2026-08-29 07:05:12.951	\N	\N
f9e6d4cf-747c-41ee-918a-436d9d3da46b	d9d158e8-e789-4557-bdb0-cfddc756f13e	Codeine	DRUG	Severe nausea, vomiting	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.951	2026-08-29 07:05:12.951	\N	\N
bdc22ac5-a787-42c3-adc4-00081a0a4f55	07f04c7e-1255-4293-a2bf-2ea83fdabd05	Milk	FOOD	Diarrhea, bloating	MILD	ACTIVE	\N	2026-08-29 07:05:12.951	2026-08-29 07:05:12.951	\N	\N
6e72f527-92c4-4f69-9e26-b8b3c2ab597e	07f04c7e-1255-4293-a2bf-2ea83fdabd05	Soy	FOOD	Abdominal discomfort	MILD	ACTIVE	\N	2026-08-29 07:05:12.952	2026-08-29 07:05:12.952	\N	\N
d6d112c6-86f0-4087-9338-b714eee793b5	26bde02c-ef9a-48db-bd66-4d00c8761b1f	Dust	ENVIRONMENTAL	Coughing, sneezing	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.952	2026-08-29 07:05:12.952	\N	\N
6a262ce0-85cd-4873-8ccd-31641388e93a	26bde02c-ef9a-48db-bd66-4d00c8761b1f	Pollen	ENVIRONMENTAL	Seasonal rhinitis	MILD	ACTIVE	\N	2026-08-29 07:05:12.952	2026-08-29 07:05:12.952	\N	\N
bd4c07ed-7538-4cea-b360-9e0018baf191	bd47230f-0b87-4425-a811-558564d21ace	Peanuts	FOOD	Throat tightness, urticaria	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.952	2026-08-29 07:05:12.952	\N	\N
6bcc937d-0549-4111-8884-822a9882679e	8cc03dd3-6369-4b4d-b112-cd00753f3d35	Eggs	FOOD	Skin rash, eczema flare	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.953	2026-08-29 07:05:12.953	\N	\N
0f1a0ccf-94d0-4e00-8c90-6ad1f42b5b60	8cc03dd3-6369-4b4d-b112-cd00753f3d35	Wheat	FOOD	Abdominal pain, diarrhea	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.953	2026-08-29 07:05:12.953	\N	\N
146cedbe-31b5-48a9-9e32-19c504d1cad9	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	Bee Sting	ENVIRONMENTAL	Swelling, pain at sting site	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.953	2026-08-29 07:05:12.953	\N	\N
d3e3a633-4944-4f73-b35e-5249edac5e36	ec2163c3-7cee-4b49-b59f-a1095c577801	Codeine	DRUG	Severe nausea and headache	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.953	2026-08-29 07:05:12.953	\N	\N
c2c0a1a6-19ab-42de-83e5-66f34c2bcdb7	ec2163c3-7cee-4b49-b59f-a1095c577801	Ibuprofen	DRUG	GI bleeding history	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.954	2026-08-29 07:05:12.954	\N	\N
20253c2a-f905-48c5-980f-3866886e28ae	69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	Aspirin	DRUG	Bronchospasm	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.954	2026-08-29 07:05:12.954	\N	\N
36034cfd-6d4d-4b5c-9862-1fd65586f096	69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	Latex	ENVIRONMENTAL	Contact dermatitis	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.954	2026-08-29 07:05:12.954	\N	\N
65a4b1a7-2a0a-4aac-840f-b73e0233fafc	b23a9c6f-46f1-47b4-9c46-bac503de6ee0	Shellfish	FOOD	Hives, facial swelling	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.954	2026-08-29 07:05:12.954	\N	\N
1a091986-6c2c-42dd-907b-14d608a3e4e6	f5736042-5ff0-43d9-9aaa-57d51b309f3b	Peanuts	FOOD	Throat tightness	SEVERE	ACTIVE	\N	2026-08-29 07:05:12.955	2026-08-29 07:05:12.955	\N	\N
eef8fbd3-010d-444c-92a0-c2f1356705a2	ca70ab17-8137-4d7c-b893-2270fbdb66db	Sulfa	DRUG	Skin rash	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.955	2026-08-29 07:05:12.955	\N	\N
8920f6b6-38a3-42e0-8587-3759aae501bd	ca70ab17-8137-4d7c-b893-2270fbdb66db	Pollen	ENVIRONMENTAL	Seasonal rhinitis	MILD	ACTIVE	\N	2026-08-29 07:05:12.955	2026-08-29 07:05:12.955	\N	\N
66a319a8-d876-4553-9640-164f2ada41c4	56b164e9-3307-42ae-953e-fb2dd482de9f	Dust	ENVIRONMENTAL	Coughing	MILD	ACTIVE	\N	2026-08-29 07:05:12.955	2026-08-29 07:05:12.955	\N	\N
c9b8636d-bc0a-43a9-8f43-14b4d7483f77	56b164e9-3307-42ae-953e-fb2dd482de9f	Milk	FOOD	Bloating	MILD	ACTIVE	\N	2026-08-29 07:05:12.955	2026-08-29 07:05:12.955	\N	\N
7f788391-ab85-4574-97b3-1ab6a1f97eb9	d2de2be3-984c-4da4-a603-ff1db0cc4d8a	Penicillin	DRUG	Anaphylaxis history	LIFE_THREATENING	ACTIVE	\N	2026-08-29 07:05:12.956	2026-08-29 07:05:12.956	\N	\N
b0432bc9-d85a-4b7c-a48b-811e7d81b96b	d2de2be3-984c-4da4-a603-ff1db0cc4d8a	Eggs	FOOD	Urticaria	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.956	2026-08-29 07:05:12.956	\N	\N
03b2d46e-b57c-4d12-8c71-84ed4348bc00	e3bb3f77-c3cd-40f9-aa21-52782e0decdd	Latex	ENVIRONMENTAL	Contact urticaria	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.956	2026-08-29 07:05:12.956	\N	\N
96053f01-017c-4df5-a6ee-515d33b91e9e	72cbbde0-7870-4579-bdf5-00960d1c6ad3	Penicillin	DRUG	Rash	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.956	2026-08-29 07:05:12.956	\N	\N
68fd3687-5be7-45bf-a130-0a23b5b47924	8df03486-18de-4954-af40-f06edfa8b9d3	Aspirin	DRUG	GI upset	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.957	2026-08-29 07:05:12.957	\N	\N
7f658a3a-45b9-45a5-bb6c-a229979b636b	8df03486-18de-4954-af40-f06edfa8b9d3	Codeine	DRUG	Nausea, dizziness	MODERATE	ACTIVE	\N	2026-08-29 07:05:12.957	2026-08-29 07:05:12.957	\N	\N
\.


--
-- Data for Name: PatientVitals; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."PatientVitals" (id, "patientId", "heightCm", "weightKg", bmi, "temperatureC", "pulseBpm", "systolicBp", "diastolicBp", "spo2Percent", "respiratoryRate", "recordedAt", "createdAt", "createdById", "medicalStatus", "appointmentId") FROM stdin;
2eebd827-a4c0-4927-8e34-5ab9d8615378	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	172	73	24.7	99.1	80	135	88	96	17	2026-07-30 07:03:35.228	2026-08-29 07:03:35.229	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
9c2eecad-c7b2-40b5-ba23-38f4ed2fff78	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	172	74	25	98.6	76	132	86	97	16	2026-08-15 07:03:35.229	2026-08-29 07:03:35.229	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
90f1055a-6d11-46b6-826f-73be69719776	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	172	75	25.4	98.4	74	130	85	97	16	2026-08-29 07:03:35.229	2026-08-29 07:03:35.229	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
ada61561-3044-4ccb-9f64-b0d85a83c8c6	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	155	70	29.1	99.1	82	152	96	95	19	2026-07-15 07:03:35.23	2026-08-29 07:03:35.23	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
86587aa8-fc05-4bd0-bef2-69245bae312f	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	155	69	28.7	98.8	80	148	94	96	18	2026-08-11 07:03:35.23	2026-08-29 07:03:35.231	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
ac195991-c329-4542-9c17-3036fc1460d1	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	155	68	28.3	98.6	78	145	92	96	18	2026-08-29 07:03:35.231	2026-08-29 07:03:35.231	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
e6e55fb5-3e03-4446-969f-d2e6640aacce	2cdbcde7-5f63-4f7d-8cc1-821e027ac0c3	80	10.5	16.4	99	105	82	52	98	26	2026-06-30 07:03:35.231	2026-08-29 07:03:35.232	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
650071fb-8645-4edb-b7e7-e420e6163922	2cdbcde7-5f63-4f7d-8cc1-821e027ac0c3	85	12	16.6	98.8	100	85	55	98	24	2026-08-29 07:03:35.232	2026-08-29 07:03:35.232	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
8a235841-600d-48f9-aaa0-2fbc66bcd0f4	4e9d8f18-0b92-4c6a-9dee-bece4ed31b72	163	60	22.6	98.4	72	120	78	99	16	2026-07-25 07:03:35.233	2026-08-29 07:03:35.233	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
383172e9-4223-4e3f-95d6-93e013b1d58a	4e9d8f18-0b92-4c6a-9dee-bece4ed31b72	163	58	21.8	98.2	70	118	76	99	15	2026-08-29 07:03:35.233	2026-08-29 07:03:35.233	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
fb088ac7-8f08-4b8a-9401-0dbf8fe04945	a429815d-b625-4b24-b689-bb5d878e4297	178	90	28.4	98.8	85	155	98	94	20	2026-07-20 07:03:35.234	2026-08-29 07:03:35.234	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
d0f83cf0-e047-4ab6-a33c-e65d2acb9671	a429815d-b625-4b24-b689-bb5d878e4297	178	89	28.1	98.4	83	152	96	95	19	2026-08-19 07:03:35.234	2026-08-29 07:03:35.234	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
439cab4c-8f6e-4f92-837a-c42b7a4a1ad4	a429815d-b625-4b24-b689-bb5d878e4297	178	88	27.8	98.6	82	150	95	95	19	2026-08-29 07:03:35.235	2026-08-29 07:03:35.235	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
3ff4122d-9e92-45b8-89ce-44fdd0870b66	25104f0d-fa52-430c-aea0-b720d50f4831	160	54	21.1	98.2	70	112	72	99	15	2026-08-14 07:03:35.235	2026-08-29 07:03:35.235	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
de5cc89c-a51d-44ca-8ac1-1da18788c100	25104f0d-fa52-430c-aea0-b720d50f4831	160	52	20.3	98	68	110	70	99	14	2026-08-29 07:03:35.236	2026-08-29 07:03:35.236	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
139a536f-062c-46ba-9c3b-3dccba02429c	339d05de-a730-4301-adf1-89b263291ec3	180	84	25.9	98.4	74	128	82	98	16	2026-08-09 07:03:35.236	2026-08-29 07:03:35.237	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
bf5ef5fa-0d09-4b7c-9903-0471fdbf13bc	339d05de-a730-4301-adf1-89b263291ec3	180	82	25.3	98.2	72	125	80	98	15	2026-08-29 07:03:35.237	2026-08-29 07:03:35.237	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
21f2cdbc-7053-47c1-b418-8aaf5fdc0331	5ac94232-db70-4b26-9e05-a8608e17644c	158	66	26.4	98.6	78	142	90	97	18	2026-06-30 07:03:35.237	2026-08-29 07:03:35.238	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
63bcf135-e088-4b7f-9434-993c53c67687	5ac94232-db70-4b26-9e05-a8608e17644c	158	65	26	98.2	77	140	89	97	17	2026-07-30 07:03:35.237	2026-08-29 07:03:35.238	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
11b4d5c2-44e3-44df-a065-156902ca3036	5ac94232-db70-4b26-9e05-a8608e17644c	158	64	25.6	98.4	76	138	88	97	17	2026-08-29 07:03:35.238	2026-08-29 07:03:35.238	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
522ae2cc-a707-4dd5-97f2-94f8be11cf2b	156e8a3c-bb9e-4b1a-b441-b8f90ac13cba	175	68	22.2	98	70	115	72	99	14	2026-08-29 07:03:35.239	2026-08-29 07:03:35.239	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
48446686-46a9-4bf4-b9fc-0666ae0efc45	7613fa7a-5862-4f51-b66a-f8ea678366a7	152	74	32	99	82	160	102	94	21	2026-07-15 07:03:35.239	2026-08-29 07:03:35.24	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
d8ca6094-0c0c-4e9e-ac43-21ae6ea8959b	7613fa7a-5862-4f51-b66a-f8ea678366a7	152	73	31.6	98.6	81	158	100	95	20	2026-08-14 07:03:35.24	2026-08-29 07:03:35.24	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
90a4aead-364c-4109-8c4e-ae4a324f5547	7613fa7a-5862-4f51-b66a-f8ea678366a7	152	72	31.2	98.8	80	155	100	95	20	2026-08-29 07:03:35.24	2026-08-29 07:03:35.24	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
bf263de1-a41f-4e83-8ac6-a6feeb2c9cca	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	158	75	30	99	86	155	96	95	19	2026-07-20 07:03:35.241	2026-08-29 07:03:35.241	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
7e17d35f-4f7c-4b18-a489-c490708c1103	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	158	73	29.2	98.4	84	150	94	96	18	2026-08-14 07:03:35.241	2026-08-29 07:03:35.241	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
381483aa-8718-4413-bb22-d5e3f28b2822	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	158	72	28.8	98.6	82	148	92	96	18	2026-08-29 07:03:35.242	2026-08-29 07:03:35.242	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
c875ce8d-3c39-4ff5-b89c-59a20ff37e9a	c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	170	88	30.4	98.8	80	148	92	95	18	2026-06-30 07:03:35.242	2026-08-29 07:03:35.242	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
b1fc07f3-1b89-4ef6-8208-422dd5bc1fe8	c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	170	86	29.8	98.6	79	145	90	96	17	2026-07-30 07:03:35.242	2026-08-29 07:03:35.242	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
89d433da-70f5-4bea-a07c-c84eaa71ed21	c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	170	85	29.4	98.4	78	142	88	96	17	2026-08-29 07:03:35.243	2026-08-29 07:03:35.243	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
4888d76e-9284-474f-bf93-05e78948c7a4	a7484f05-7285-4b27-a0d5-bc777f06391b	165	56	20.6	98.4	74	114	73	99	15	2026-08-17 07:03:35.243	2026-08-29 07:03:35.244	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
1c7415ac-322a-4829-bec4-cf1fc83d1aa3	a7484f05-7285-4b27-a0d5-bc777f06391b	165	55	20.2	98.2	72	112	72	99	14	2026-08-29 07:03:35.244	2026-08-29 07:03:35.244	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
12c24034-6c1f-47ee-9454-4b1cc78b9edf	cf464e01-ef63-46a4-b15a-5f12cd872ed6	175	92	30	98.8	86	158	98	94	21	2026-07-10 07:03:35.244	2026-08-29 07:03:35.245	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
7732e4cb-77f3-4156-af45-72ecf0c194d4	cf464e01-ef63-46a4-b15a-5f12cd872ed6	175	90	29.4	98.6	84	152	96	95	20	2026-08-29 07:03:35.245	2026-08-29 07:03:35.245	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
82a7d7e8-94f7-4592-8307-f197c1380d79	34cadfdf-d66c-45fa-8b9a-cdd8aa22b2ca	160	58	22.7	98.2	74	115	72	99	15	2026-07-30 07:03:35.245	2026-08-29 07:03:35.246	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
60140bd0-c5a4-4e21-a065-71e5ca8519e3	34cadfdf-d66c-45fa-8b9a-cdd8aa22b2ca	160	62	24.2	98.4	76	118	74	98	16	2026-08-29 07:03:35.246	2026-08-29 07:03:35.246	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
bfe5b476-918c-4366-8201-bb78019887b9	67595c75-e99f-4f60-afc8-a46df858ba02	176	78	25.2	98	72	120	78	98	15	2026-08-29 07:03:35.247	2026-08-29 07:03:35.247	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
f5453b18-89cd-4c9a-af7f-c785c7fb5b69	cc1c801f-4411-4b3b-a5ec-884fec96a867	148	62	28.3	98.6	78	140	85	96	18	2026-07-15 07:03:35.247	2026-08-29 07:03:35.248	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
eaf44762-ca58-47a1-bea8-9a20ad68249b	cc1c801f-4411-4b3b-a5ec-884fec96a867	148	60	27.4	98.4	76	135	82	97	17	2026-08-29 07:03:35.248	2026-08-29 07:03:35.248	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
7bf253a2-72ac-4e10-8ec3-c6a299df7592	3759cb6d-c848-452c-9bf3-0fb7ebfcaea7	172	64	21.6	98.2	76	120	76	99	15	2026-08-09 07:03:35.248	2026-08-29 07:03:35.249	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
aa90ce30-2a95-486f-a803-497d74639575	3759cb6d-c848-452c-9bf3-0fb7ebfcaea7	172	65	22	98	74	118	74	99	14	2026-08-29 07:03:35.249	2026-08-29 07:03:35.249	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
a8902ae7-9a62-46ac-af23-1788aa68df1c	12f74868-1ade-4939-9c8f-3c270e37f144	155	70	29.1	98.8	82	165	102	94	20	2026-07-25 07:03:35.249	2026-08-29 07:03:35.25	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
69aa7052-f448-4e22-9fa1-2b17f10c7b30	12f74868-1ade-4939-9c8f-3c270e37f144	155	69	28.7	98.4	81	162	100	95	19	2026-08-19 07:03:35.249	2026-08-29 07:03:35.25	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
0d771f09-9dbe-4041-9f19-2ba86bef5b73	12f74868-1ade-4939-9c8f-3c270e37f144	155	68	28.3	98.6	80	160	100	95	19	2026-08-29 07:03:35.25	2026-08-29 07:03:35.25	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
cebec244-710f-49e8-9dc9-681ba1bdf2bd	d9d158e8-e789-4557-bdb0-cfddc756f13e	178	80	25.2	98.2	70	122	78	99	14	2026-08-29 07:03:35.251	2026-08-29 07:03:35.251	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
ce1e1cab-afa6-4b62-87ae-8e1e688af675	07f04c7e-1255-4293-a2bf-2ea83fdabd05	150	67	29.8	99	84	145	90	95	19	2026-07-30 07:03:35.251	2026-08-29 07:03:35.252	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
464151c8-7e4d-4a23-9269-f02ecc6c4fe5	07f04c7e-1255-4293-a2bf-2ea83fdabd05	150	65	28.9	98.8	82	140	88	96	18	2026-08-29 07:03:35.252	2026-08-29 07:03:35.252	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
57d26394-3cb2-4637-9773-9963202d0be9	26bde02c-ef9a-48db-bd66-4d00c8761b1f	174	84	27.7	99.2	88	130	84	96	20	2026-08-09 07:03:35.252	2026-08-29 07:03:35.253	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
dce65f04-7e80-4f5d-8eed-dd60169d37fd	26bde02c-ef9a-48db-bd66-4d00c8761b1f	174	82	27.1	98.4	78	128	82	97	16	2026-08-29 07:03:35.253	2026-08-29 07:03:35.253	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
514c094e-7f7e-4866-a100-1cb8f1d0174c	c2fcdec3-e0c5-4f8a-9760-f99103988000	162	54	20.6	98	72	110	68	99	14	2026-08-29 07:03:35.254	2026-08-29 07:03:35.254	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
128868a5-43c9-458f-9fbd-287bb8f4fee4	bd47230f-0b87-4425-a811-558564d21ace	168	80	28.3	98.4	82	142	88	96	18	2026-08-04 07:03:35.254	2026-08-29 07:03:35.255	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
fd76f0b1-931f-4355-8bbf-24fc1265e97a	bd47230f-0b87-4425-a811-558564d21ace	168	78	27.6	98.6	80	138	86	97	17	2026-08-29 07:03:35.255	2026-08-29 07:03:35.255	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
9f2d3a1c-9fdf-4284-bb8a-cf271609a6d3	8cc03dd3-6369-4b4d-b112-cd00753f3d35	164	58	21.6	98.2	70	114	72	99	14	2026-08-29 07:03:35.256	2026-08-29 07:03:35.256	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
2973bcca-0eb1-4441-aac7-76084cf436e1	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	180	95	29.3	98.6	82	150	95	95	19	2026-07-18 07:03:35.256	2026-08-29 07:03:35.256	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
b5b2315b-a5b3-42da-9d3c-2c2975ad9913	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	180	93	28.7	98.4	81	148	93	96	18	2026-08-15 07:03:35.256	2026-08-29 07:03:35.257	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
e59f5c6b-b62a-4f98-9bcc-b2f77234f766	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	180	92	28.4	98.4	80	145	92	96	18	2026-08-29 07:03:35.257	2026-08-29 07:03:35.257	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
5553073e-41aa-4b4f-92df-ff55f39ed3b0	ec2163c3-7cee-4b49-b59f-a1095c577801	162	73	27.8	98.8	80	148	94	96	18	2026-07-10 07:03:35.257	2026-08-29 07:03:35.258	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
14c27115-4128-4cae-a1df-d01e4f5261d0	ec2163c3-7cee-4b49-b59f-a1095c577801	162	71	27.1	98.4	79	142	92	97	17	2026-08-09 07:03:35.258	2026-08-29 07:03:35.258	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
6edb2536-1fc0-427f-b941-f690709f7e79	ec2163c3-7cee-4b49-b59f-a1095c577801	162	70	26.7	98.6	78	140	90	97	17	2026-08-29 07:03:35.259	2026-08-29 07:03:35.259	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
04df1fb6-9413-4041-84e4-b357e8086ee3	69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	172	89	30.1	98.6	84	155	96	95	19	2026-06-30 07:03:35.259	2026-08-29 07:03:35.259	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
f7e8cddd-b2db-4b1d-8116-da86fd647a2c	69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	172	87	29.4	98.4	83	150	94	96	18	2026-08-04 07:03:35.259	2026-08-29 07:03:35.26	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
23e73f3c-440c-422c-8542-f97089fc81b1	69bcb85c-9239-4ec2-b9d1-b92ed0b51d4e	172	86	29.1	98.4	82	148	92	96	18	2026-08-29 07:03:35.26	2026-08-29 07:03:35.26	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
39cd6727-13fb-49f3-b1b7-b89e07fe15e5	b23a9c6f-46f1-47b4-9c46-bac503de6ee0	168	60	21.3	98	70	108	68	99	14	2026-08-29 07:03:35.261	2026-08-29 07:03:35.261	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
3eddb63e-d23f-4474-9639-cc1f39c71abf	f5736042-5ff0-43d9-9aaa-57d51b309f3b	166	85	30.8	99	86	160	100	94	21	2026-07-15 07:03:35.261	2026-08-29 07:03:35.261	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
5985cc3d-580d-4bdb-ba19-9f0fd31aaeb6	f5736042-5ff0-43d9-9aaa-57d51b309f3b	166	83	30.1	98.6	85	158	99	95	20	2026-08-17 07:03:35.261	2026-08-29 07:03:35.262	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
e9f74a6f-08ec-4145-a742-f042c95412ef	f5736042-5ff0-43d9-9aaa-57d51b309f3b	166	82	29.8	98.8	84	155	98	95	20	2026-08-29 07:03:35.262	2026-08-29 07:03:35.262	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
2ffbd05b-bb8b-4fac-8593-9b4af97e1345	ca70ab17-8137-4d7c-b893-2270fbdb66db	160	52	20.3	98.2	72	108	70	99	14	2026-08-29 07:03:35.263	2026-08-29 07:03:35.263	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
311b6d36-9a66-47d2-8a15-005b1b5ba349	240c3b04-ac4a-4dd5-8ecd-6df0ed23ec5e	165	74	27.2	98.4	78	138	86	96	17	2026-07-20 07:03:35.263	2026-08-29 07:03:35.263	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
735a7678-3917-4565-af0a-ba9417c1796a	240c3b04-ac4a-4dd5-8ecd-6df0ed23ec5e	165	72	26.4	98.6	76	132	84	97	16	2026-08-29 07:03:35.264	2026-08-29 07:03:35.264	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
4622f045-f94c-4a20-8429-97421f29b805	56b164e9-3307-42ae-953e-fb2dd482de9f	182	89	26.9	100.2	88	120	78	98	18	2026-08-14 07:03:35.264	2026-08-29 07:03:35.264	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
4f26a20b-4685-4f6c-b4c9-5699ddad994a	56b164e9-3307-42ae-953e-fb2dd482de9f	182	88	26.6	98	68	118	76	99	14	2026-08-29 07:03:35.265	2026-08-29 07:03:35.265	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
dd9b5c09-3065-4250-9b0d-db8336987aed	d2de2be3-984c-4da4-a603-ff1db0cc4d8a	150	64	28.4	99.2	84	168	104	94	22	2026-07-05 07:03:35.265	2026-08-29 07:03:35.266	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
91b00465-56f3-46ad-af1b-2fc8ccf15336	d2de2be3-984c-4da4-a603-ff1db0cc4d8a	150	63	28	98.8	82	162	102	95	20	2026-08-09 07:03:35.265	2026-08-29 07:03:35.266	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
999628dd-d801-4ca4-bea3-1cf63649052a	d2de2be3-984c-4da4-a603-ff1db0cc4d8a	150	62	27.6	98.8	80	160	100	95	20	2026-08-29 07:03:35.266	2026-08-29 07:03:35.266	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
9a7c8b11-a05f-4bb8-b709-97ea25dc7fca	e3bb3f77-c3cd-40f9-aa21-52782e0decdd	176	71	22.9	98.2	74	116	75	99	14	2026-08-17 07:03:35.266	2026-08-29 07:03:35.267	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
91dd8dd9-bd78-4b14-b9bb-f3a54e5bf385	e3bb3f77-c3cd-40f9-aa21-52782e0decdd	176	70	22.6	98	72	115	74	99	14	2026-08-29 07:03:35.267	2026-08-29 07:03:35.267	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
87edb5b4-6d9b-4443-ad14-c3e7763131eb	88c2590c-052e-4a03-983c-b7cc80bc52e7	156	68	27.9	98.6	78	140	88	96	17	2026-07-25 07:03:35.267	2026-08-29 07:03:35.268	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
0d42e4dd-0396-48fe-86d3-36240492daac	88c2590c-052e-4a03-983c-b7cc80bc52e7	156	66	27.1	98.4	76	135	86	97	16	2026-08-29 07:03:35.268	2026-08-29 07:03:35.268	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
e983c1ec-7314-4d75-a2a7-d47075c285b6	d31220e9-dc44-4708-9bbc-324064cd129e	170	80	27.7	98.8	82	148	92	95	18	2026-07-30 07:03:35.268	2026-08-29 07:03:35.269	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
553ea5e9-1b37-4920-8c3d-77bc2e044ad8	d31220e9-dc44-4708-9bbc-324064cd129e	170	78	27	98.6	80	142	90	96	17	2026-08-29 07:03:35.269	2026-08-29 07:03:35.269	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
d7aaf934-86c0-4396-9025-1f7dfd2038ef	246f369f-9d32-493d-9ee5-c63ce6e54482	164	58	21.6	98.2	72	112	72	99	14	2026-08-29 07:03:35.27	2026-08-29 07:03:35.27	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
3286bd71-6d50-4b11-8926-004467f9c1c9	72cbbde0-7870-4579-bdf5-00960d1c6ad3	174	86	28.4	98.6	82	150	94	95	18	2026-07-25 07:03:35.27	2026-08-29 07:03:35.271	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
f9d716ba-868b-4575-868f-572b360f443a	72cbbde0-7870-4579-bdf5-00960d1c6ad3	174	84	27.7	98.4	80	145	92	96	17	2026-08-29 07:03:35.271	2026-08-29 07:03:35.271	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
44da17cd-0ff1-4215-b924-7e4badeb25d1	235b535a-e400-486c-8cf4-340dcc3b57f4	158	57	22.8	98.2	72	108	68	99	15	2026-08-09 07:03:35.271	2026-08-29 07:03:35.272	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
5ff09e01-338f-468c-94dc-85b8aeeba60b	235b535a-e400-486c-8cf4-340dcc3b57f4	158	55	22	98	70	106	66	99	14	2026-08-29 07:03:35.272	2026-08-29 07:03:35.272	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
be53d720-1125-4019-88f4-6eb75a648d22	8df03486-18de-4954-af40-f06edfa8b9d3	168	78	27.6	98.4	80	142	90	96	17	2026-07-10 07:03:35.272	2026-08-29 07:03:35.273	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
79ed9b67-1fff-4d94-b8d5-95f575907701	8df03486-18de-4954-af40-f06edfa8b9d3	168	77	27.3	98.6	79	140	89	97	16	2026-08-11 07:03:35.272	2026-08-29 07:03:35.273	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
3602d3f7-9509-43fd-b957-bf00cf63f0ad	8df03486-18de-4954-af40-f06edfa8b9d3	168	76	26.9	98.6	78	138	88	97	16	2026-08-29 07:03:35.273	2026-08-29 07:03:35.273	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	\N
fe0e4277-ed1b-46b1-aab9-070028c0e726	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	172	70	23.7	98.4	78	120	80	98	16	2026-08-29 07:05:12.909	2026-08-29 07:05:12.909	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	4061bcf8-8fb3-4709-a7a7-1b9084525fa9
71b664de-9550-4b4c-84ec-f860ca657398	cc3bcd05-b213-4214-b947-f2c6b2d2dae4	160	58	22.7	98.6	74	118	76	99	15	2026-08-29 07:05:12.91	2026-08-29 07:05:12.91	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	d3bae922-ff80-4746-8b63-ab6cb88d111d
\.


--
-- Data for Name: Permission; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Permission" (id, resource, action, name, "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
4ec7609e-409f-4644-9917-72a2554333cc	medicine-groups	read	Read Medicine Groups	2026-08-29 04:57:31.403	2026-08-29 04:57:31.403	\N	\N
5ca9f1e1-f421-4dc9-a9d6-44818028da27	medicine-groups	create	Create Medicine Groups	2026-08-29 04:57:31.42	2026-08-29 04:57:31.42	\N	\N
2e4f4e7e-5a00-4532-b3c3-d69256b28010	medicine-groups	update	Update Medicine Groups	2026-08-29 04:57:31.421	2026-08-29 04:57:31.421	\N	\N
eda243b0-0f86-4503-9bf3-e22522485eee	medicine-groups	delete	Delete Medicine Groups	2026-08-29 04:57:31.422	2026-08-29 04:57:31.422	\N	\N
4f4dc380-f37f-4c0a-b299-cdcb95e6f7ee	units	read	Read Units	2026-08-29 04:57:31.422	2026-08-29 04:57:31.422	\N	\N
77d5adea-29b0-4475-bfd6-7295150d4a02	units	create	Create Units	2026-08-29 04:57:31.423	2026-08-29 04:57:31.423	\N	\N
cb46087c-3ac0-485c-8a16-7092d2dced4a	units	update	Update Units	2026-08-29 04:57:31.424	2026-08-29 04:57:31.424	\N	\N
8439f64c-3be6-4fc8-bac8-612529a614c9	units	delete	Delete Units	2026-08-29 04:57:31.425	2026-08-29 04:57:31.425	\N	\N
f8d96964-f8b9-490c-8712-f41745e56ce5	departments	read	Read Departments	2026-08-29 05:22:06.774	2026-08-29 05:22:06.774	\N	\N
0cf5d1ad-b4a4-4cac-a09f-274d7d4368a5	departments	create	Create Departments	2026-08-29 05:22:06.78	2026-08-29 05:22:06.78	\N	\N
49fd1070-01e7-4af0-9a39-ef93cf344911	departments	update	Update Departments	2026-08-29 05:22:06.781	2026-08-29 05:22:06.781	\N	\N
62c9555d-4546-4ca2-9024-c33b9ba651c3	departments	delete	Delete Departments	2026-08-29 05:22:06.782	2026-08-29 05:22:06.782	\N	\N
6b435541-76e0-4124-9c36-9b046a6baf7d	designations	read	Read Designations	2026-08-29 05:22:06.783	2026-08-29 05:22:06.783	\N	\N
e5fa0458-4e99-41b5-a358-ef8c352f015f	designations	create	Create Designations	2026-08-29 05:22:06.784	2026-08-29 05:22:06.784	\N	\N
0feb9e25-346b-493f-b522-d3f810c56ecd	designations	update	Update Designations	2026-08-29 05:22:06.785	2026-08-29 05:22:06.785	\N	\N
a3cb4eec-ab76-47c8-8a7e-57297e7f2b19	designations	delete	Delete Designations	2026-08-29 05:22:06.786	2026-08-29 05:22:06.786	\N	\N
a5a765ab-4147-4f9d-add7-dd81afa30bac	patients	read	Read Patients	2026-08-26 09:20:04.788	2026-08-26 09:20:04.788	\N	\N
7f29cb8a-9a75-4e2f-aa4f-024443cc0243	patients	create	Create Patients	2026-08-26 09:20:04.789	2026-08-26 09:20:04.789	\N	\N
92d6fff6-b59e-462e-bcf7-62f5cf8626fc	patients	update	Update Patients	2026-08-26 09:20:04.791	2026-08-26 09:20:04.791	\N	\N
19492974-7c6c-424d-90e3-415c7d90c095	patients	delete	Delete Patients	2026-08-26 09:20:04.792	2026-08-26 09:20:04.792	\N	\N
9cee2939-5c6b-4404-8ad1-3927015c5032	patients	manage	Manage Patients	2026-08-26 09:20:04.792	2026-08-26 09:20:04.792	\N	\N
4b14694d-0266-41f3-93c9-1eef3e428e21	appointments	read	Read Appointments	2026-08-26 09:20:04.793	2026-08-26 09:20:04.793	\N	\N
bdc44c2f-07c6-480b-b43b-5e18aa080e7c	appointments	create	Create Appointments	2026-08-26 09:20:04.794	2026-08-26 09:20:04.794	\N	\N
6e5b3703-f6be-4c57-b72e-d93a231f2f40	appointments	update	Update Appointments	2026-08-26 09:20:04.794	2026-08-26 09:20:04.794	\N	\N
dd8cdabf-8427-4cd8-8056-45776e21f27c	appointments	delete	Delete Appointments	2026-08-26 09:20:04.795	2026-08-26 09:20:04.795	\N	\N
ca1f7ea9-c375-427c-bf25-8ac863d22474	appointments	manage	Manage Appointments	2026-08-26 09:20:04.795	2026-08-26 09:20:04.795	\N	\N
61e0404a-1b15-48e1-99ef-3f941cf03719	doctors	read	Read Doctors	2026-08-26 09:20:04.796	2026-08-26 09:20:04.796	\N	\N
1cc2d967-7d8e-40b0-abfb-36ec5063d306	doctors	create	Create Doctors	2026-08-26 09:20:04.796	2026-08-26 09:20:04.796	\N	\N
1d0aff5b-8ec8-4ba0-8b57-d0038da4d6f7	doctors	update	Update Doctors	2026-08-26 09:20:04.797	2026-08-26 09:20:04.797	\N	\N
150c4a48-046c-42ea-96ad-3708685f3bff	doctors	delete	Delete Doctors	2026-08-26 09:20:04.798	2026-08-26 09:20:04.798	\N	\N
3e3b399d-66e5-47b3-a391-1df58939e1a4	doctors	manage	Manage Doctors	2026-08-26 09:20:04.801	2026-08-26 09:20:04.801	\N	\N
e5894154-fe9a-4d9b-a8e0-3bd0be57da80	prescriptions	read	Read Prescriptions	2026-08-26 09:20:04.802	2026-08-26 09:20:04.802	\N	\N
6bdd9754-a44a-4a6f-8c3a-35bf2a513ae4	prescriptions	create	Create Prescriptions	2026-08-26 09:20:04.804	2026-08-26 09:20:04.804	\N	\N
c1c5b8f6-9e10-404b-a2d4-753059268bbf	prescriptions	update	Update Prescriptions	2026-08-26 09:20:04.805	2026-08-26 09:20:04.805	\N	\N
196a1981-329f-4aa8-8109-2aa8d2619068	prescriptions	delete	Delete Prescriptions	2026-08-26 09:20:04.807	2026-08-26 09:20:04.807	\N	\N
e1b5d2a4-5b61-4f0d-b4a3-5e07421e4da2	prescriptions	manage	Manage Prescriptions	2026-08-26 09:20:04.808	2026-08-26 09:20:04.808	\N	\N
b57b206f-79a7-43ba-9206-b2e1c20b16a5	medicine-catalog	read	Read Medicine Catalog	2026-08-26 09:20:04.81	2026-08-26 09:20:04.81	\N	\N
7a771cfb-5cf0-497e-8dc2-eeefe49f3851	medicine-catalog	create	Create Medicine Catalog	2026-08-26 09:20:04.81	2026-08-26 09:20:04.81	\N	\N
1e5931de-535c-4ded-81e2-81a5dee81d48	medicine-catalog	update	Update Medicine Catalog	2026-08-26 09:20:04.812	2026-08-26 09:20:04.812	\N	\N
361429c4-48ca-4ae7-b3dd-5cb9d611d7b8	medicine-catalog	delete	Delete Medicine Catalog	2026-08-26 09:20:04.812	2026-08-26 09:20:04.812	\N	\N
a92b6185-aa14-44aa-a345-96b717c1bb77	medicine-catalog	manage	Manage Medicine Catalog	2026-08-26 09:20:04.813	2026-08-26 09:20:04.813	\N	\N
d95aef2a-597a-4431-ac59-fd24d6800b8a	queue	read	Read Queue	2026-08-26 09:20:04.814	2026-08-26 09:20:04.814	\N	\N
b89b9e61-a100-4503-8e95-5241a8bbd41a	queue	create	Create Queue	2026-08-26 09:20:04.815	2026-08-26 09:20:04.815	\N	\N
8e246550-5f64-4b38-8fdf-364e84834b4c	queue	update	Update Queue	2026-08-26 09:20:04.815	2026-08-26 09:20:04.815	\N	\N
27f30eaf-7e76-413e-aaab-9995f043d0e8	queue	delete	Delete Queue	2026-08-26 09:20:04.816	2026-08-26 09:20:04.816	\N	\N
28f05241-4dbd-4294-95cc-0e5b32908e5c	queue	manage	Manage Queue	2026-08-26 09:20:04.816	2026-08-26 09:20:04.816	\N	\N
79f2be7e-97cd-4834-b402-1b18a06c55d8	billing	read	Read Billing	2026-08-26 09:20:04.817	2026-08-26 09:20:04.817	\N	\N
e1163203-c622-4412-8f97-20e853054a8d	billing	create	Create Billing	2026-08-26 09:20:04.817	2026-08-26 09:20:04.817	\N	\N
a2531330-edce-4d89-85fd-ae23ee5c20a1	billing	update	Update Billing	2026-08-26 09:20:04.818	2026-08-26 09:20:04.818	\N	\N
759e6c73-2514-44cc-8d99-2f5c27b3269e	billing	delete	Delete Billing	2026-08-26 09:20:04.818	2026-08-26 09:20:04.818	\N	\N
3c4fd736-8f88-44a1-9b90-8773b6de97dd	billing	manage	Manage Billing	2026-08-26 09:20:04.819	2026-08-26 09:20:04.819	\N	\N
c28818e7-c45a-49d0-88a3-acafd7534bf2	dispensing	read	Read Dispensing	2026-08-26 09:20:04.82	2026-08-26 09:20:04.82	\N	\N
2ce79964-1dfa-44e8-847c-7819603accc1	dispensing	create	Create Dispensing	2026-08-26 09:20:04.821	2026-08-26 09:20:04.821	\N	\N
17e544e5-34e7-419c-af74-4216dc0173db	dispensing	update	Update Dispensing	2026-08-26 09:20:04.821	2026-08-26 09:20:04.821	\N	\N
200c43ac-7a96-45fa-95c4-c0cba2b381cb	dispensing	delete	Delete Dispensing	2026-08-26 09:20:04.822	2026-08-26 09:20:04.822	\N	\N
60ed47d4-1d40-4792-9c45-d9a421971446	dispensing	manage	Manage Dispensing	2026-08-26 09:20:04.823	2026-08-26 09:20:04.823	\N	\N
8733bdb8-7115-4677-96e1-07d7cb03e466	lab-orders	read	Read Lab Orders	2026-08-26 09:20:04.824	2026-08-26 09:20:04.824	\N	\N
0bbd7ec7-151b-4244-87b9-f115e67ea267	lab-orders	create	Create Lab Orders	2026-08-26 09:20:04.826	2026-08-26 09:20:04.826	\N	\N
b8e19d82-6375-460b-af9a-d2c5b79b4643	lab-orders	update	Update Lab Orders	2026-08-26 09:20:04.827	2026-08-26 09:20:04.827	\N	\N
33de2fa4-81df-4213-bac8-b7eefaea7f3b	lab-orders	delete	Delete Lab Orders	2026-08-26 09:20:04.827	2026-08-26 09:20:04.827	\N	\N
c0db0ac6-bb61-410c-a5e6-00aee60bc069	lab-orders	manage	Manage Lab Orders	2026-08-26 09:20:04.828	2026-08-26 09:20:04.828	\N	\N
ce820d85-6792-45bc-8171-51d73abe9bc2	radiology-orders	read	Read Radiology Orders	2026-08-26 09:20:04.829	2026-08-26 09:20:04.829	\N	\N
def4b678-37f7-4db1-883d-8670b533f528	radiology-orders	create	Create Radiology Orders	2026-08-26 09:20:04.83	2026-08-26 09:20:04.83	\N	\N
0bc14667-c88b-44ed-8f21-b16517814ad6	radiology-orders	update	Update Radiology Orders	2026-08-26 09:20:04.831	2026-08-26 09:20:04.831	\N	\N
8be35967-04fb-4444-8489-370192ec7f6c	radiology-orders	delete	Delete Radiology Orders	2026-08-26 09:20:04.832	2026-08-26 09:20:04.832	\N	\N
5b18ed8e-e12c-4425-a9fd-5ba95e409494	radiology-orders	manage	Manage Radiology Orders	2026-08-26 09:20:04.832	2026-08-26 09:20:04.832	\N	\N
381dc234-e156-43d5-806f-53c89c25ee69	procedure-orders	read	Read Procedure Orders	2026-08-26 09:20:04.833	2026-08-26 09:20:04.833	\N	\N
9d89778e-5509-414e-9a49-d2b8d90468d0	procedure-orders	create	Create Procedure Orders	2026-08-26 09:20:04.833	2026-08-26 09:20:04.833	\N	\N
89fe8421-88bc-45b6-8674-c9af2bff4097	procedure-orders	update	Update Procedure Orders	2026-08-26 09:20:04.834	2026-08-26 09:20:04.834	\N	\N
a3bef66b-d93d-41ac-81eb-4e651de12ec8	procedure-orders	delete	Delete Procedure Orders	2026-08-26 09:20:04.834	2026-08-26 09:20:04.834	\N	\N
7e87664f-35d9-432a-b5f3-c60e09684f43	procedure-orders	manage	Manage Procedure Orders	2026-08-26 09:20:04.835	2026-08-26 09:20:04.835	\N	\N
96f3a063-1961-47ec-993d-77402c2a36a6	diagnoses	read	Read Diagnoses	2026-08-26 09:20:04.835	2026-08-26 09:20:04.835	\N	\N
80271763-d29b-415a-a4f8-57c921835317	diagnoses	create	Create Diagnoses	2026-08-26 09:20:04.836	2026-08-26 09:20:04.836	\N	\N
7df5ef0b-71f2-45e7-8a81-24b62e48e537	diagnoses	update	Update Diagnoses	2026-08-26 09:20:04.837	2026-08-26 09:20:04.837	\N	\N
beffa728-a884-4b3f-91ed-34542b2b4497	diagnoses	delete	Delete Diagnoses	2026-08-26 09:20:04.838	2026-08-26 09:20:04.838	\N	\N
32abfddb-1442-4db3-aaf5-9ddda4b25ddd	diagnoses	manage	Manage Diagnoses	2026-08-26 09:20:04.839	2026-08-26 09:20:04.839	\N	\N
5990c6a3-1634-4462-9506-0fd40cf0d0ac	diagnosis-systems	read	Read Diagnosis Systems	2026-08-26 09:20:04.84	2026-08-26 09:20:04.84	\N	\N
819482e8-7c87-4529-9f56-a858b9ec2171	diagnosis-systems	create	Create Diagnosis Systems	2026-08-26 09:20:04.841	2026-08-26 09:20:04.841	\N	\N
00d54aac-d94e-4d3f-950c-779506c63992	diagnosis-systems	update	Update Diagnosis Systems	2026-08-26 09:20:04.842	2026-08-26 09:20:04.842	\N	\N
91f5764f-acae-4fc2-afeb-315d411b784b	diagnosis-systems	delete	Delete Diagnosis Systems	2026-08-26 09:20:04.843	2026-08-26 09:20:04.843	\N	\N
b6de3e56-8110-41d6-9ee5-1dca223d6a5b	diagnosis-systems	manage	Manage Diagnosis Systems	2026-08-26 09:20:04.844	2026-08-26 09:20:04.844	\N	\N
70752de0-2ba4-4ab0-a02e-fe637f99e569	allergies	read	Read Allergies	2026-08-26 09:20:04.845	2026-08-26 09:20:04.845	\N	\N
280f545b-a9ee-4e2d-8382-0c0a10635db2	allergies	create	Create Allergies	2026-08-26 09:20:04.845	2026-08-26 09:20:04.845	\N	\N
f1f0b1a5-6a13-4a0f-a366-841d0740be03	allergies	update	Update Allergies	2026-08-26 09:20:04.846	2026-08-26 09:20:04.846	\N	\N
cacc4af8-5d93-4fb5-9e2b-99aa3b24532a	allergies	delete	Delete Allergies	2026-08-26 09:20:04.846	2026-08-26 09:20:04.846	\N	\N
5ee97650-1b42-435a-a67b-5e5e55dd6969	allergies	manage	Manage Allergies	2026-08-26 09:20:04.846	2026-08-26 09:20:04.846	\N	\N
aad6bd3e-74a1-4e5d-8b0b-22da38e3f372	patient-allergy-records	read	Read Patient Allergy Records	2026-08-26 09:20:04.847	2026-08-26 09:20:04.847	\N	\N
478bc932-e323-4f64-9bba-d69b486c8942	patient-allergy-records	create	Create Patient Allergy Records	2026-08-26 09:20:04.847	2026-08-26 09:20:04.847	\N	\N
af1ff94f-58e9-4c94-9b6c-a3ab5862fae3	patient-allergy-records	update	Update Patient Allergy Records	2026-08-26 09:20:04.848	2026-08-26 09:20:04.848	\N	\N
93561b5e-9933-4e07-9ee0-4f665790397b	patient-allergy-records	delete	Delete Patient Allergy Records	2026-08-26 09:20:04.848	2026-08-26 09:20:04.848	\N	\N
1cce472b-7dc1-4500-b0d8-51456367d41d	patient-allergy-records	manage	Manage Patient Allergy Records	2026-08-26 09:20:04.849	2026-08-26 09:20:04.849	\N	\N
f24f8f9f-0f2f-45dd-8bde-7a4675038c0e	patient-vitals	read	Read Patient Vitals	2026-08-26 09:20:04.85	2026-08-26 09:20:04.85	\N	\N
029f6010-9513-4567-9e64-81054b3a9a5d	patient-vitals	create	Create Patient Vitals	2026-08-26 09:20:04.85	2026-08-26 09:20:04.85	\N	\N
1fe2b3ac-2d8e-4d24-b957-a417af2193a8	patient-vitals	update	Update Patient Vitals	2026-08-26 09:20:04.851	2026-08-26 09:20:04.851	\N	\N
30083a51-b320-47a1-8807-3885c93cc6cf	patient-vitals	delete	Delete Patient Vitals	2026-08-26 09:20:04.852	2026-08-26 09:20:04.852	\N	\N
f1b5eb76-dc2e-4f62-b88b-2508a7d2317c	patient-vitals	manage	Manage Patient Vitals	2026-08-26 09:20:04.852	2026-08-26 09:20:04.852	\N	\N
fb8511c8-b508-41ba-b2b6-e46102d21023	addresses	read	Read Addresses	2026-08-26 09:20:04.853	2026-08-26 09:20:04.853	\N	\N
18a07157-b253-4d05-9964-2da1e1a9eb00	addresses	create	Create Addresses	2026-08-26 09:20:04.853	2026-08-26 09:20:04.853	\N	\N
f4882909-15b0-4c35-b2a1-999e14829592	addresses	update	Update Addresses	2026-08-26 09:20:04.854	2026-08-26 09:20:04.854	\N	\N
e740af27-ec6f-4dc4-9ba5-b451ce3eb34f	addresses	delete	Delete Addresses	2026-08-26 09:20:04.854	2026-08-26 09:20:04.854	\N	\N
610ffe17-9962-48f4-99b3-db8958c9ac48	addresses	manage	Manage Addresses	2026-08-26 09:20:04.855	2026-08-26 09:20:04.855	\N	\N
116f45ea-4564-4a4e-b869-f88749b97bb1	organisation	read	Read Organisation	2026-08-26 09:20:04.855	2026-08-26 09:20:04.855	\N	\N
63fa184e-67b9-4049-bebd-f7d3960bdc1b	organisation	create	Create Organisation	2026-08-26 09:20:04.856	2026-08-26 09:20:04.856	\N	\N
daccf665-3a85-4dcb-8dbd-a4098bfcb3b3	organisation	update	Update Organisation	2026-08-26 09:20:04.856	2026-08-26 09:20:04.856	\N	\N
95f5a6c2-93f8-4a17-bc9b-a93079b93825	organisation	delete	Delete Organisation	2026-08-26 09:20:04.857	2026-08-26 09:20:04.857	\N	\N
a02012a1-c88b-4c22-a3d6-bb840011953b	organisation	manage	Manage Organisation	2026-08-26 09:20:04.857	2026-08-26 09:20:04.857	\N	\N
06d19100-70f8-42cb-97cc-240a1233b770	financial-years	read	Read Financial Years	2026-08-26 09:20:04.858	2026-08-26 09:20:04.858	\N	\N
1483f154-b33b-4c13-8b25-8fa05d236c5b	financial-years	create	Create Financial Years	2026-08-26 09:20:04.859	2026-08-26 09:20:04.859	\N	\N
0e34d364-fd8a-4d0b-80ef-9f1f548412e3	financial-years	update	Update Financial Years	2026-08-26 09:20:04.86	2026-08-26 09:20:04.86	\N	\N
533e516e-0627-4811-bb0c-a7dc36d07385	financial-years	delete	Delete Financial Years	2026-08-26 09:20:04.86	2026-08-26 09:20:04.86	\N	\N
4a1d527c-0735-401b-9423-9dd861840dda	financial-years	manage	Manage Financial Years	2026-08-26 09:20:04.861	2026-08-26 09:20:04.861	\N	\N
fc72bf6d-9cfa-4330-b314-ba6f8e29db35	prescription-templates	read	Read Prescription Templates	2026-08-26 09:20:04.861	2026-08-26 09:20:04.861	\N	\N
2a291886-e7bf-4130-b654-cc4e8093bc7f	prescription-templates	create	Create Prescription Templates	2026-08-26 09:20:04.862	2026-08-26 09:20:04.862	\N	\N
d7ff07e6-a7c1-44a0-8919-d27e192a3392	prescription-templates	update	Update Prescription Templates	2026-08-26 09:20:04.862	2026-08-26 09:20:04.862	\N	\N
edecde5b-9fa6-4b65-b417-7d55153884af	prescription-templates	delete	Delete Prescription Templates	2026-08-26 09:20:04.865	2026-08-26 09:20:04.865	\N	\N
e02e3e4c-ffc0-4ad3-8295-ab02569ac69b	prescription-templates	manage	Manage Prescription Templates	2026-08-26 09:20:04.867	2026-08-26 09:20:04.867	\N	\N
c4833b1d-014d-44fa-8c26-ca5ef7c2efe3	users	read	Read Users	2026-08-26 09:20:04.868	2026-08-26 09:20:04.868	\N	\N
386706ad-176e-4eea-9c8a-4426439c41fb	users	create	Create Users	2026-08-26 09:20:04.868	2026-08-26 09:20:04.868	\N	\N
6c0d4660-355d-4c20-8ffb-cfa88575ae81	users	update	Update Users	2026-08-26 09:20:04.869	2026-08-26 09:20:04.869	\N	\N
3b1d4e87-8d68-45d9-9de2-e78ff8812ceb	users	delete	Delete Users	2026-08-26 09:20:04.87	2026-08-26 09:20:04.87	\N	\N
24a76ad0-ac80-4536-ba15-12e0d80ee7cc	users	manage	Manage Users	2026-08-26 09:20:04.87	2026-08-26 09:20:04.87	\N	\N
c8d857a8-771f-4661-ab37-d00d4d498d41	roles	read	Read Roles	2026-08-26 09:20:04.871	2026-08-26 09:20:04.871	\N	\N
5806f3da-c972-4cac-8d0e-65f0c84804c1	roles	create	Create Roles	2026-08-26 09:20:04.872	2026-08-26 09:20:04.872	\N	\N
341e2663-3d3d-4788-9618-56af99a30838	roles	update	Update Roles	2026-08-26 09:20:04.872	2026-08-26 09:20:04.872	\N	\N
6e319e74-dfc4-43ec-96a4-5cf9689dcd12	roles	delete	Delete Roles	2026-08-26 09:20:04.873	2026-08-26 09:20:04.873	\N	\N
4c553635-ccf8-45d8-9c2b-13d832548775	roles	manage	Manage Roles	2026-08-26 09:20:04.873	2026-08-26 09:20:04.873	\N	\N
82876879-c200-48ae-945d-26912caf75e7	permissions	read	Read Permissions	2026-08-26 09:20:04.873	2026-08-26 09:20:04.873	\N	\N
2e35281d-5d2e-4625-97d1-e63c25ad71e0	permissions	create	Create Permissions	2026-08-26 09:20:04.874	2026-08-26 09:20:04.874	\N	\N
3ed155ce-1ca9-48dc-8c4f-7e7352308091	permissions	update	Update Permissions	2026-08-26 09:20:04.874	2026-08-26 09:20:04.874	\N	\N
da2afd87-a5bb-40a6-bb2d-d4e8889ebc51	permissions	delete	Delete Permissions	2026-08-26 09:20:04.875	2026-08-26 09:20:04.875	\N	\N
a160ce1a-55fa-4fba-a39f-968ec274f863	permissions	manage	Manage Permissions	2026-08-26 09:20:04.875	2026-08-26 09:20:04.875	\N	\N
bc37cce1-b592-496c-94bd-4bfb15ea7ab1	shifts	read	Read Shifts	2026-08-26 09:20:04.876	2026-08-26 09:20:04.876	\N	\N
64b37557-48c1-4717-8d81-0babbd03ffea	shifts	create	Create Shifts	2026-08-26 09:20:04.876	2026-08-26 09:20:04.876	\N	\N
2a6436ae-45fc-4603-a687-5607b84b6233	shifts	update	Update Shifts	2026-08-26 09:20:04.877	2026-08-26 09:20:04.877	\N	\N
38aa6ac1-2a89-4fbe-aa93-81341aff25b5	shifts	delete	Delete Shifts	2026-08-26 09:20:04.877	2026-08-26 09:20:04.877	\N	\N
22acbf6e-fc76-4544-bbb2-42690e56de8c	shifts	manage	Manage Shifts	2026-08-26 09:20:04.877	2026-08-26 09:20:04.877	\N	\N
5a65c1de-4286-4908-a809-ffe08ec63e6c	employee-schedules	read	Read Employee Schedules	2026-08-26 09:20:04.878	2026-08-26 09:20:04.878	\N	\N
464722c4-8052-4891-b425-a6e8041e9b85	employee-schedules	create	Create Employee Schedules	2026-08-26 09:20:04.878	2026-08-26 09:20:04.878	\N	\N
bd292c6c-d193-4122-9772-f72c3406720d	employee-schedules	update	Update Employee Schedules	2026-08-26 09:20:04.879	2026-08-26 09:20:04.879	\N	\N
292f2afa-eb0c-4e59-9b4d-a28e37480681	employee-schedules	delete	Delete Employee Schedules	2026-08-26 09:20:04.879	2026-08-26 09:20:04.879	\N	\N
8e7fd7be-1f5c-49c9-b33c-34c69ac86b85	employee-schedules	manage	Manage Employee Schedules	2026-08-26 09:20:04.88	2026-08-26 09:20:04.88	\N	\N
22326d56-b9d6-4074-9164-02232e54465b	documents	read	Read Documents	2026-08-26 09:20:04.88	2026-08-26 09:20:04.88	\N	\N
acbf8cb0-fbeb-411d-8b8a-deb5ed3832de	documents	create	Create Documents	2026-08-26 09:20:04.881	2026-08-26 09:20:04.881	\N	\N
fec02527-69a6-4ec5-886f-608dc747f400	documents	update	Update Documents	2026-08-26 09:20:04.881	2026-08-26 09:20:04.881	\N	\N
a3f9c2f4-0ad7-4d5b-b210-473c36cad0c2	documents	delete	Delete Documents	2026-08-26 09:20:04.881	2026-08-26 09:20:04.881	\N	\N
a0114636-e1ab-495f-9423-7d10f30b392b	documents	manage	Manage Documents	2026-08-26 09:20:04.882	2026-08-26 09:20:04.882	\N	\N
da0eac42-237b-4976-a997-d1965761ffd7	settings	read	Read Settings	2026-08-26 09:20:04.882	2026-08-26 09:20:04.882	\N	\N
d34ab0b8-d130-4ffd-bcdb-d1b50c003f88	settings	create	Create Settings	2026-08-26 09:20:04.883	2026-08-26 09:20:04.883	\N	\N
bc80d56f-0c88-4a20-8d7d-460d5acdbf80	settings	update	Update Settings	2026-08-26 09:20:04.883	2026-08-26 09:20:04.883	\N	\N
7f98e29a-3306-464d-a452-e3796c969dd0	settings	delete	Delete Settings	2026-08-26 09:20:04.884	2026-08-26 09:20:04.884	\N	\N
ed98a46f-16b5-43e1-adcd-47e7ac2ded2b	settings	manage	Manage Settings	2026-08-26 09:20:04.884	2026-08-26 09:20:04.884	\N	\N
bcf130c1-6302-49bb-8e6a-abe087d8118c	dashboard	read	Read Dashboard	2026-08-26 09:20:04.885	2026-08-26 09:20:04.885	\N	\N
33ab868c-0869-400e-a83b-2245bab2b6bc	dashboard	create	Create Dashboard	2026-08-26 09:20:04.885	2026-08-26 09:20:04.885	\N	\N
30a57ba2-ca37-43d5-ada4-84cc3669f5a4	dashboard	update	Update Dashboard	2026-08-26 09:20:04.886	2026-08-26 09:20:04.886	\N	\N
fac8bd41-a531-4b6d-a86c-83f0eb815231	dashboard	delete	Delete Dashboard	2026-08-26 09:20:04.886	2026-08-26 09:20:04.886	\N	\N
e9e0094d-1902-4d85-b34f-fc576a934c6f	dashboard	manage	Manage Dashboard	2026-08-26 09:20:04.887	2026-08-26 09:20:04.887	\N	\N
dce0f11a-0069-490d-8ee1-6e56ce56dd8d	reports	read	Read Reports	2026-08-26 09:20:04.887	2026-08-26 09:20:04.887	\N	\N
d0b771e8-6b1d-48e9-a1e6-8e1f563d9422	reports	create	Create Reports	2026-08-26 09:20:04.887	2026-08-26 09:20:04.887	\N	\N
edf67755-46c8-404c-a7e7-5c04c5bf20a1	reports	update	Update Reports	2026-08-26 09:20:04.888	2026-08-26 09:20:04.888	\N	\N
ede85e4c-8e63-4704-90a2-b72ed388c19e	reports	delete	Delete Reports	2026-08-26 09:20:04.888	2026-08-26 09:20:04.888	\N	\N
0842ab98-98a0-48bd-8068-ed7ae02cbd00	reports	manage	Manage Reports	2026-08-26 09:20:04.888	2026-08-26 09:20:04.888	\N	\N
a0a17cd8-4979-4d84-a001-bf3277c96d59	developer	read	Read Developer	2026-08-26 09:20:04.889	2026-08-26 09:20:04.889	\N	\N
710c428d-a35d-4e09-a511-63c57d405ccc	developer	create	Create Developer	2026-08-26 09:20:04.889	2026-08-26 09:20:04.889	\N	\N
ef75fbd4-8181-4ae9-b7b9-820808ea2123	developer	update	Update Developer	2026-08-26 09:20:04.889	2026-08-26 09:20:04.889	\N	\N
4bc6025f-82df-479e-9537-0cefb03a3216	developer	delete	Delete Developer	2026-08-26 09:20:04.89	2026-08-26 09:20:04.89	\N	\N
d49df12b-bde6-439e-8742-25484e5183bc	developer	manage	Manage Developer	2026-08-26 09:20:04.89	2026-08-26 09:20:04.89	\N	\N
ab75f8c1-d660-4ad2-8643-f4507cb25cd9	health	read	Read Health	2026-08-26 09:20:04.891	2026-08-26 09:20:04.891	\N	\N
478f8e70-7382-4aa9-aabb-15eb574cb98a	health	create	Create Health	2026-08-26 09:20:04.891	2026-08-26 09:20:04.891	\N	\N
dd3c40a2-f463-4ec3-99a5-a36e6ee52224	health	update	Update Health	2026-08-26 09:20:04.892	2026-08-26 09:20:04.892	\N	\N
55dfd2b6-64e2-414d-b69b-699ce69bb385	health	delete	Delete Health	2026-08-26 09:20:04.892	2026-08-26 09:20:04.892	\N	\N
c06c4b13-0b21-41c4-87ee-e5aa2b7c4bac	health	manage	Manage Health	2026-08-26 09:20:04.893	2026-08-26 09:20:04.893	\N	\N
dae39af5-7743-480c-a7bb-15f2e7816307	medicine-groups	manage	Manage Medicine Groups	2026-08-29 07:03:35.036	2026-08-29 07:03:35.036	\N	\N
f3473aef-4237-4580-88cd-4a100b60ef12	units	manage	Manage Units	2026-08-29 07:03:35.038	2026-08-29 07:03:35.038	\N	\N
de9d9187-d0fc-4813-9733-834aeb6fedf8	departments	manage	Manage Departments	2026-08-29 07:03:35.04	2026-08-29 07:03:35.04	\N	\N
fc8f683b-3a0b-4786-82bc-ca9f79c33044	designations	manage	Manage Designations	2026-08-29 07:03:35.042	2026-08-29 07:03:35.042	\N	\N
\.


--
-- Data for Name: Prescription; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Prescription" (id, "patientId", "doctorId", diagnosis, notes, status, "createdAt", "updatedAt", "createdById", "updatedById", version) FROM stdin;
a79e160b-553f-4827-948e-8f6b1dc04efd	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Essential Hypertension	Follow up in 2 weeks. Reduce salt intake.	ACTIVE	2026-08-29 07:03:35.275	2026-08-29 07:03:35.275	\N	\N	1
9050d7b0-c985-4314-b077-e6ff998381e3	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Upper Respiratory Tract Infection	Complete the full course of antibiotics.	DISPENSED	2026-08-22 07:03:35.279	2026-08-22 07:03:35.279	\N	\N	1
f6f677d6-6e42-4abc-91d7-0e83ae8b82bc	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Vitamin D Deficiency	Sun exposure 15 min daily.	DISPENSED	2026-07-30 07:03:35.28	2026-07-30 07:03:35.28	\N	\N	1
18f53f04-cfd0-4085-84bf-fe21960219a8	5ac94232-db70-4b26-9e05-a8608e17644c	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Type 2 Diabetes Mellitus	Diet control and regular exercise. Recheck HbA1c in 3 months.	ACTIVE	2026-08-29 07:03:35.283	2026-08-29 07:03:35.283	\N	\N	1
772553ab-ef90-4e2a-a805-d4a4fb9d094b	5ac94232-db70-4b26-9e05-a8608e17644c	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Dyslipidemia	Low-fat diet. Walk 30 min daily.	DISPENSED	2026-07-30 07:03:35.284	2026-07-30 07:03:35.284	\N	\N	1
c7cc2e73-f532-4470-8a8d-29d6d9c40b59	28d2a4db-d6f0-4094-8a5d-1770b18b6a8f	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Iron Deficiency Anemia	Take iron on empty stomach.	DISPENSED	2026-08-26 07:03:35.285	2026-08-26 07:03:35.285	\N	\N	1
4ba9b2e6-8d75-456d-a0dc-8ec7c178b1fd	c27fd2a1-ceee-4af1-93e9-e8a78c10dfbc	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Dyslipidemia	Low-fat diet. Walk 30 min daily.	ACTIVE	2026-08-24 07:03:35.286	2026-08-24 07:03:35.286	\N	\N	1
d5da3593-0510-4664-801a-5d463aa25238	cf464e01-ef63-46a4-b15a-5f12cd872ed6	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Type 2 Diabetes Mellitus	HbA1c 8.1% — optimize control.	ACTIVE	2026-08-27 07:03:35.287	2026-08-27 07:03:35.287	\N	\N	1
2e0cdbfe-13b5-436e-a9c1-523a81749e3f	d9d158e8-e789-4557-bdb0-cfddc756f13e	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Influenza	Oseltamivir if within 48h. Rest fluids.	DISPENSED	2026-08-27 07:03:35.289	2026-08-27 07:03:35.289	\N	\N	1
33a84cb5-62f0-4947-97d4-12d0f9f4ad91	07f04c7e-1255-4293-a2bf-2ea83fdabd05	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Type 2 Diabetes Mellitus	HbA1c 7.8%. Diet + exercise + Metformin.	ACTIVE	2026-08-29 07:03:35.289	2026-08-29 07:03:35.289	\N	\N	1
0430805e-0bf9-42dd-8055-c87548f44a05	26bde02c-ef9a-48db-bd66-4d00c8761b1f	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Acute Bronchitis	Inhaler PRN. Complete course.	DISPENSED	2026-08-24 07:03:35.29	2026-08-24 07:03:35.29	\N	\N	1
90fdaf2c-96c4-4121-9bcb-545a2527c20f	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Obesity	Diet plan + exercise. Follow up monthly.	ACTIVE	2026-08-29 07:03:35.291	2026-08-29 07:03:35.291	\N	\N	1
17c7507c-ab5a-4d52-bbfa-cd15fa57a9f5	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Essential Hypertension	Lifestyle changes + medication.	ACTIVE	2026-08-15 07:03:35.291	2026-08-15 07:03:35.291	\N	\N	1
1ef5fd1a-e44e-4290-81f5-fd62c20b7656	ec2163c3-7cee-4b49-b59f-a1095c577801	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Migraine	Prophylaxis with Amitriptyline. Avoid triggers.	ACTIVE	2026-08-29 07:03:35.292	2026-08-29 07:03:35.292	\N	\N	1
649ec71e-698b-4dd3-9c75-b9615cd41583	d31220e9-dc44-4708-9bbc-324064cd129e	c95d58c6-c888-440e-8e4f-d84f4ea1487c	GERD	PPI 4 weeks. Lifestyle modifications.	ACTIVE	2026-08-29 07:03:35.295	2026-08-29 07:03:35.295	\N	\N	1
f3a7fca7-ab4b-40a5-9f71-2c6f42f1bcfa	72cbbde0-7870-4579-bdf5-00960d1c6ad3	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Hypothyroidism	Levothyroxine on empty stomach. Recheck TSH in 6 weeks.	ACTIVE	2026-08-29 07:03:35.296	2026-08-29 07:03:35.296	\N	\N	1
\.


--
-- Data for Name: PrescriptionHistory; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."PrescriptionHistory" (id, "prescriptionId", version, diagnosis, notes, status, items, "changeType", "changeReason", "createdAt", "createdById") FROM stdin;
\.


--
-- Data for Name: PrescriptionItem; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."PrescriptionItem" (id, "prescriptionId", "medicineId", "medicineName", dosage, duration, instructions, quantity, refills, "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
2d307b1a-cb71-487a-9e24-a65b7cca44e0	a79e160b-553f-4827-948e-8f6b1dc04efd	5aae2f82-93b4-4e29-a669-f53103095a1e	Amlodipine	1-0-0	30 days	\N	2	0	2026-08-29 07:03:35.275	2026-08-29 07:03:35.275	\N	\N
ad6ea814-eb34-4711-904a-cb53804656ca	a79e160b-553f-4827-948e-8f6b1dc04efd	8e9f80a1-f911-4d24-b8d9-467e12d951ad	Telmisartan	0-0-1	30 days	\N	1	0	2026-08-29 07:03:35.275	2026-08-29 07:03:35.275	\N	\N
d5f19fb2-4024-4667-9205-0c28ed2faa01	9050d7b0-c985-4314-b077-e6ff998381e3	c7b9a1bd-f58c-4a30-aaaf-da33c945cdb0	Amoxicillin	1-0-1	7 days	\N	1	0	2026-08-29 07:03:35.28	2026-08-29 07:03:35.28	\N	\N
b8aa2120-fcbd-4654-81ed-ff9dd6821d6e	9050d7b0-c985-4314-b077-e6ff998381e3	97ef1746-8c11-4c1d-934d-87f87ae00a9d	Cetirizine	0-0-1	7 days	\N	1	0	2026-08-29 07:03:35.28	2026-08-29 07:03:35.28	\N	\N
b9c96bf8-6b14-4e43-b1c8-b94d2186f520	f6f677d6-6e42-4abc-91d7-0e83ae8b82bc	f5b3d68d-52bd-441b-8015-7b5f640692a7	Vitamin D3	1-0-0	60 days	\N	1	0	2026-08-29 07:03:35.28	2026-08-29 07:03:35.28	\N	\N
bd9ede31-5608-4a98-8b6c-5bae47a935c5	18f53f04-cfd0-4085-84bf-fe21960219a8	648da3fa-4f47-40e1-bd3b-5161634c1761	Metformin	1-0-1	90 days	\N	3	0	2026-08-29 07:03:35.283	2026-08-29 07:03:35.283	\N	\N
fda4dc92-0ac6-4d38-ad9b-0ebc95021629	772553ab-ef90-4e2a-a805-d4a4fb9d094b	5806b756-c61e-4a51-85a1-ff29622cf90a	Atorvastatin	0-0-1	90 days	\N	3	0	2026-08-29 07:03:35.284	2026-08-29 07:03:35.284	\N	\N
054baf50-0b9f-4f84-83f7-b8d663c3c351	c7cc2e73-f532-4470-8a8d-29d6d9c40b59	6749db69-2a1c-4cf4-ab51-39937c97a707	Iron + Folic Acid	1-0-0	60 days	\N	2	0	2026-08-29 07:03:35.285	2026-08-29 07:03:35.285	\N	\N
507d2d57-07e5-43f4-9689-6b0cb8265e43	c7cc2e73-f532-4470-8a8d-29d6d9c40b59	unknown	Vitamin C	1-0-0	60 days	\N	2	0	2026-08-29 07:03:35.285	2026-08-29 07:03:35.285	\N	\N
0a13a533-b635-4d93-92c1-fbb258ac3990	4ba9b2e6-8d75-456d-a0dc-8ec7c178b1fd	5806b756-c61e-4a51-85a1-ff29622cf90a	Atorvastatin	0-0-1	90 days	\N	3	0	2026-08-29 07:03:35.286	2026-08-29 07:03:35.286	\N	\N
53b84ed8-da7f-4649-913d-5e0700d41ae0	d5da3593-0510-4664-801a-5d463aa25238	648da3fa-4f47-40e1-bd3b-5161634c1761	Metformin	1-0-1	90 days	\N	3	0	2026-08-29 07:03:35.287	2026-08-29 07:03:35.287	\N	\N
ac9db19b-ba56-4ee4-8b99-862d39802cf7	d5da3593-0510-4664-801a-5d463aa25238	7cd5b836-0b67-44fb-b3e6-30411d58d1f1	Glimepiride	1-0-0	90 days	\N	2	0	2026-08-29 07:03:35.287	2026-08-29 07:03:35.287	\N	\N
0b8232f5-2af6-4dac-9db4-51f9a12bce56	2e0cdbfe-13b5-436e-a9c1-523a81749e3f	72d0b002-986c-4204-a2b1-3878788e42ce	Oseltamivir	1-0-1	5 days	\N	1	0	2026-08-29 07:03:35.289	2026-08-29 07:03:35.289	\N	\N
e405a4c1-84de-41ad-9d9d-ab7dc370e68a	2e0cdbfe-13b5-436e-a9c1-523a81749e3f	714fdcce-3a10-445d-bc4c-615a7cf20b89	Paracetamol	1-0-1	5 days	\N	1	0	2026-08-29 07:03:35.289	2026-08-29 07:03:35.289	\N	\N
480ee329-3422-4957-a0fa-9e17422a9c9e	33a84cb5-62f0-4947-97d4-12d0f9f4ad91	648da3fa-4f47-40e1-bd3b-5161634c1761	Metformin	1-0-1	90 days	\N	3	0	2026-08-29 07:03:35.29	2026-08-29 07:03:35.29	\N	\N
ce940430-e1a3-4164-bd60-46b605fe67b7	0430805e-0bf9-42dd-8055-c87548f44a05	97fbf6a6-3c6e-4f60-a3e1-db990f5ee002	Salbutamol Inhaler	1 puff PRN	14 days	\N	1	0	2026-08-29 07:03:35.29	2026-08-29 07:03:35.29	\N	\N
76db285c-d658-400f-b1cc-5ea680ea22cf	0430805e-0bf9-42dd-8055-c87548f44a05	c7b9a1bd-f58c-4a30-aaaf-da33c945cdb0	Amoxicillin	1-0-1	7 days	\N	1	0	2026-08-29 07:03:35.29	2026-08-29 07:03:35.29	\N	\N
658f0178-fcbf-49d8-91dd-d0ba8ef4940e	0430805e-0bf9-42dd-8055-c87548f44a05	083f23db-30d2-467f-9d8c-5ee05d02591d	Montelukast + Levocetirizine	0-0-1	10 days	\N	1	0	2026-08-29 07:03:35.29	2026-08-29 07:03:35.29	\N	\N
333d0011-6a61-4354-8a5e-f421cbc97745	90fdaf2c-96c4-4121-9bcb-545a2527c20f	unknown	Orlistat	1-0-1	30 days	\N	1	0	2026-08-29 07:03:35.291	2026-08-29 07:03:35.291	\N	\N
c9eaecc6-89ff-4a37-acb3-7a130d9fcd6f	17c7507c-ab5a-4d52-bbfa-cd15fa57a9f5	5aae2f82-93b4-4e29-a669-f53103095a1e	Amlodipine	1-0-0	30 days	\N	1	0	2026-08-29 07:03:35.292	2026-08-29 07:03:35.292	\N	\N
ffee1b53-7477-427e-bed6-9788f66611f5	17c7507c-ab5a-4d52-bbfa-cd15fa57a9f5	177cedd1-8174-4095-a0e6-954e55eb3ae5	Losartan	0-0-1	30 days	\N	1	0	2026-08-29 07:03:35.292	2026-08-29 07:03:35.292	\N	\N
17ffaa5d-085a-479a-b366-552cc2feae10	1ef5fd1a-e44e-4290-81f5-fd62c20b7656	714fdcce-3a10-445d-bc4c-615a7cf20b89	Paracetamol	1-0-1 SOS	5 days	\N	1	0	2026-08-29 07:03:35.293	2026-08-29 07:03:35.293	\N	\N
a52ca4ac-4e79-417c-92d1-2a6b38716486	1ef5fd1a-e44e-4290-81f5-fd62c20b7656	dfaae434-55ce-42fc-a007-401b469d1124	Escitalopram	0-0-1	30 days	\N	1	0	2026-08-29 07:03:35.293	2026-08-29 07:03:35.293	\N	\N
aa0b9d5a-c747-4abb-87e1-74dba082b896	649ec71e-698b-4dd3-9c75-b9615cd41583	a5a5b41b-6903-4c78-be98-0bcf9e826e6e	Pantoprazole	1-0-0	30 days	\N	1	0	2026-08-29 07:03:35.295	2026-08-29 07:03:35.295	\N	\N
d6266d7a-d4e4-4d38-9c04-62d8574853f5	649ec71e-698b-4dd3-9c75-b9615cd41583	e0189e4b-2eb1-4040-b895-b70d25678c99	Domperidone	1-0-1	14 days	\N	1	0	2026-08-29 07:03:35.295	2026-08-29 07:03:35.295	\N	\N
8beb1bb5-d87f-4a85-85b2-6eaec19f7254	f3a7fca7-ab4b-40a5-9f71-2c6f42f1bcfa	3ec26dc9-378b-45fe-bbde-9f0fea03039c	Levothyroxine	1-0-0	90 days	\N	3	0	2026-08-29 07:03:35.296	2026-08-29 07:03:35.296	\N	\N
\.


--
-- Data for Name: PrescriptionTemplate; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."PrescriptionTemplate" (id, name, description, "isDefault", "logoUrl", "clinicName", "doctorName", "doctorSpecialization", "doctorQualification", "doctorRegNo", "clinicAddress", "clinicPhone", "clinicEmail", "clinicWebsite", layout, "createdAt", "updatedAt", "createdById", "updatedById", type, "doctorId") FROM stdin;
23aa2e2d-8676-47a9-a2e5-593aa00be188	Classic Clinic Rx	Traditional Rx with clean lines and formal structure — the standard clinic prescription	t	\N	City Clinic — OPD	Dr. Rajesh Sharma	General Medicine	MBBS, MD	MCI-10001	\N	022-25551234	info@cityclinic.com	https://cityclinic.com	{"fontSize": "medium", "paperSize": "A4", "showNotes": true, "fontFamily": "serif", "footerText": "", "showBorder": true, "showFooter": true, "showQRCode": false, "headerStyle": "centered", "layoutStyle": "classic", "primaryColor": "#2563eb", "showRxSymbol": true, "footerColumns": ["address", "phone", "email"], "headerBgColor": "#2563eb", "showDiagnosis": true, "showWatermark": false, "secondaryColor": "#dbeafe", "recommendations": [], "showClinicAddress": true, "showMedicineTable": true, "showPatientFields": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.959	2026-08-29 07:05:12.959	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
28d27e05-ef38-49a6-afa8-9ced3a2c76fb	Modern Clinic Rx	Contemporary design with gradient header banner, rounded elements, and color accents	f	\N	City Heart Clinic	Dr. Arun Singh	Cardiology	MBBS, DM Cardiology	MCI-10005	\N	022-25551235	heart@cityclinic.com	https://cityclinic.com/heart	{"fontSize": "medium", "paperSize": "A4", "showNotes": true, "fontFamily": "sans", "footerText": "", "showBorder": true, "showFooter": true, "showQRCode": false, "headerStyle": "banner", "layoutStyle": "modern", "primaryColor": "#dc2626", "showRxSymbol": true, "footerColumns": ["address", "phone"], "headerBgColor": "#dc2626", "showDiagnosis": true, "showWatermark": false, "secondaryColor": "#fef2f2", "recommendations": [], "showClinicAddress": true, "showMedicineTable": true, "showPatientFields": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.961	2026-08-29 07:05:12.961	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
939bbd7b-65f5-439f-8c0b-70808fba97a7	Minimal Rx	Clean, minimal template without branding — ideal for quick prescriptions	f	\N						\N				{"fontSize": "small", "paperSize": "A4", "showNotes": false, "fontFamily": "sans", "footerText": "", "showBorder": false, "showFooter": false, "showQRCode": false, "headerStyle": "left", "layoutStyle": "minimal", "primaryColor": "#000000", "showRxSymbol": true, "footerColumns": [], "headerBgColor": "#000000", "showDiagnosis": false, "showWatermark": false, "secondaryColor": "#ffffff", "recommendations": [], "showClinicAddress": false, "showMedicineTable": true, "showPatientFields": true, "showRegistrationNo": false, "showRecommendations": false}	2026-08-29 07:05:12.961	2026-08-29 07:05:12.961	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
bb360bde-eab0-4480-b27b-84606a5ef8ed	Two-Column Rx	Split layout: patient info on left, medicines on right — great for detailed prescriptions	f	\N	City Clinic — OPD	Dr. Lakshmi Iyer	Gynecology	MBBS, MS OBG	MCI-10004	\N	022-25551234	info@cityclinic.com	https://cityclinic.com	{"fontSize": "small", "paperSize": "A4", "showNotes": true, "fontFamily": "sans", "footerText": "", "showBorder": true, "showFooter": true, "showQRCode": false, "headerStyle": "split", "layoutStyle": "two-column", "primaryColor": "#7c3aed", "showRxSymbol": true, "footerColumns": ["address", "phone", "email"], "headerBgColor": "#7c3aed", "showDiagnosis": true, "showWatermark": false, "secondaryColor": "#ede9fe", "recommendations": ["Continue Breastfeeding", "Vaccination Schedule", "Growth Monitoring", "Nutrition Advice", "Iron Supplements"], "showClinicAddress": true, "showMedicineTable": true, "showPatientFields": true, "showRegistrationNo": true, "showRecommendations": true}	2026-08-29 07:05:12.961	2026-08-29 07:05:12.961	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
020d3bd9-e2ee-4ad9-a32d-ce2e6f34c92e	Compact Rx	Dense layout fitting more info in less space — perfect for high-volume OPD	f	\N	City Clinic — Express	Dr. Vivek Mehta	Orthopedics	MBBS, MS Ortho	MCI-10003	\N	022-25551234	express@cityclinic.com		{"fontSize": "small", "paperSize": "A5", "showNotes": false, "fontFamily": "sans", "footerText": "", "showBorder": true, "showFooter": true, "showQRCode": false, "headerStyle": "left", "layoutStyle": "compact", "primaryColor": "#059669", "showRxSymbol": true, "footerColumns": ["address", "phone"], "headerBgColor": "#059669", "showDiagnosis": true, "showWatermark": false, "secondaryColor": "#d1fae5", "recommendations": [], "showClinicAddress": true, "showMedicineTable": true, "showPatientFields": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.962	2026-08-29 07:05:12.962	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
0a9afecf-dc8b-4d07-bf97-ce0daf566d21	Banner Rx	Full-width header banner with centered content — premium clinic look	f	\N	City Eye Centre	Dr. Deepa Nair	Ophthalmology	MBBS, MS Ophthalmology	MCI-10008	\N	022-25551234	eyes@cityclinic.com	https://cityclinic.com/eyes	{"fontSize": "medium", "paperSize": "A4", "showNotes": true, "fontFamily": "serif", "footerText": "Thank you for choosing City Eye Centre", "showBorder": true, "showFooter": true, "showQRCode": true, "headerStyle": "centered", "layoutStyle": "banner", "freeFormMode": false, "primaryColor": "#0891b2", "showRxSymbol": true, "footerColumns": ["address", "phone", "email", "website"], "headerBgColor": "#0891b2", "showDiagnosis": true, "showWatermark": true, "signatureText": "Signature:", "secondaryColor": "#ecfeff", "showHeaderLine": true, "headerLineColor": "#0891b2", "recommendations": ["Single Vision", "Bifocal", "Trifocal", "Progressive", "Polycarbonate", "Trivex", "Hi-Index", "Anti-Reflective Coating", "Photochromic", "Tint", "Polarized"], "showWritingLines": true, "writingLineCount": 20, "showClinicAddress": true, "showMedicineTable": true, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": true, "showRecommendations": true}	2026-08-29 07:05:12.962	2026-08-29 07:05:12.962	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
35841ab2-85fb-4443-b5a3-0d9f2d3c08b0	Hospital Letterhead Rx	Classic hospital letterhead with doctor info left, hospital right, and colored separator line	f	\N	City Hospital	Dr. Arun Singh	Cardiology	MBBS, DM Cardiology	MCI-10005	\N	022-25551234	info@cityhospital.com	https://cityhospital.com	{"fontSize": "medium", "paperSize": "A4", "showNotes": false, "fontFamily": "serif", "footerText": "", "showBorder": false, "showFooter": false, "showQRCode": false, "headerStyle": "split-line", "layoutStyle": "letterhead", "freeFormMode": false, "primaryColor": "#16a34a", "showRxSymbol": false, "footerColumns": [], "headerBgColor": "#16a34a", "showDiagnosis": false, "showWatermark": false, "signatureText": "Signature:", "secondaryColor": "#dcfce7", "showHeaderLine": true, "headerLineColor": "#16a34a", "recommendations": [], "showWritingLines": true, "writingLineCount": 20, "showClinicAddress": true, "showMedicineTable": true, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.964	2026-08-29 07:05:12.964	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
23811493-2550-4449-a6c6-14aa30bb0dca	Doctor's Script Pad	Free-form writing pad with lined paper and handwriting font — for doctors who prefer to write by hand	f	\N		Dr. Priya Kapoor	Dermatology	MBBS, MD Dermatology	MCI-10006	\N				{"fontSize": "large", "paperSize": "A4", "showNotes": false, "fontFamily": "handwriting", "footerText": "", "showBorder": true, "showFooter": false, "showQRCode": false, "headerStyle": "left", "layoutStyle": "doctor-script", "freeFormMode": true, "primaryColor": "#d97706", "showRxSymbol": true, "footerColumns": [], "headerBgColor": "#d97706", "showDiagnosis": true, "showWatermark": false, "signatureText": "Dr. Priya Kapoor", "secondaryColor": "#fef3c7", "showHeaderLine": true, "headerLineColor": "#d97706", "recommendations": [], "showWritingLines": true, "writingLineCount": 25, "showClinicAddress": false, "showMedicineTable": false, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.965	2026-08-29 07:05:12.965	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
65036726-b150-4b09-aa25-f1a7d96e6bf6	Quick Prescription Pad	Minimal pad — header, patient line, writing space, and signature. No footer, no table.	f	\N		Dr. Mohammed Farooq	ENT	MBBS, MS ENT	MCI-10007	\N	022-25551234			{"fontSize": "medium", "paperSize": "A4", "showNotes": false, "fontFamily": "serif", "footerText": "", "showBorder": true, "showFooter": false, "showQRCode": false, "headerStyle": "split-line", "layoutStyle": "prescription-pad", "freeFormMode": true, "primaryColor": "#7c3aed", "showRxSymbol": false, "footerColumns": [], "headerBgColor": "#7c3aed", "showDiagnosis": false, "showWatermark": false, "signatureText": "Signature:", "secondaryColor": "#ede9fe", "showHeaderLine": true, "headerLineColor": "#7c3aed", "recommendations": [], "showWritingLines": true, "writingLineCount": 22, "showClinicAddress": true, "showMedicineTable": false, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": false, "showRecommendations": false}	2026-08-29 07:05:12.965	2026-08-29 07:05:12.965	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	prescription	\N
96c94482-93bc-40cd-a5c5-83bb71106768	Standard Diagnosis Report	General diagnosis report with clinical findings, investigation, and treatment plan	t	\N	City Hospital	Dr. Rajesh Sharma	General Medicine	MBBS, MD	MCI-10001	\N	022-25551234	info@cityhospital.com	https://cityhospital.com	{"fontSize": "medium", "paperSize": "A4", "showNotes": true, "fontFamily": "serif", "footerText": "", "showBorder": true, "showFooter": true, "showQRCode": false, "headerStyle": "centered", "layoutStyle": "classic", "freeFormMode": true, "primaryColor": "#16a34a", "showRxSymbol": false, "footerColumns": ["address", "phone"], "headerBgColor": "#16a34a", "showDiagnosis": true, "showWatermark": false, "signatureText": "Signature:", "secondaryColor": "#dcfce7", "showHeaderLine": true, "headerLineColor": "#16a34a", "recommendations": [], "showWritingLines": true, "writingLineCount": 15, "showClinicAddress": true, "showMedicineTable": false, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.965	2026-08-29 07:05:12.965	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	diagnosis	\N
7eddf0a6-ab95-4717-b6bc-cae5beb5af40	Fitness Certificate	Medical fitness certificate for employment, sports, or travel	f	\N	City Hospital	Dr. Arun Singh	General Medicine	MBBS, MD	MCI-10005	\N	022-25551234	fitness@cityhospital.com		{"fontSize": "medium", "paperSize": "A4", "showNotes": true, "fontFamily": "serif", "footerText": "This certificate is valid for 30 days from the date of issue.", "showBorder": true, "showFooter": true, "showQRCode": false, "headerStyle": "split-line", "layoutStyle": "letterhead", "freeFormMode": true, "primaryColor": "#0891b2", "showRxSymbol": false, "footerColumns": ["address", "phone"], "headerBgColor": "#0891b2", "showDiagnosis": true, "showWatermark": false, "signatureText": "Doctor Signature:", "secondaryColor": "#ecfeff", "showHeaderLine": true, "headerLineColor": "#0891b2", "recommendations": [], "showWritingLines": true, "writingLineCount": 18, "showClinicAddress": true, "showMedicineTable": false, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.966	2026-08-29 07:05:12.966	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	diagnosis	\N
63b5b34a-95b1-4f8b-ab92-0b083006b1be	Sick Leave Certificate	Sick leave / medical leave certificate for employers and institutions	f	\N	City Clinic	Dr. Sunita Verma	General Medicine	MBBS, DCH	MCI-10002	\N	022-25551234			{"fontSize": "medium", "paperSize": "A4", "showNotes": false, "fontFamily": "serif", "footerText": "", "showBorder": true, "showFooter": false, "showQRCode": false, "headerStyle": "left", "layoutStyle": "minimal", "freeFormMode": true, "primaryColor": "#d97706", "showRxSymbol": false, "footerColumns": [], "headerBgColor": "#d97706", "showDiagnosis": false, "showWatermark": false, "signatureText": "Doctor Signature:", "secondaryColor": "#fef3c7", "showHeaderLine": true, "headerLineColor": "#d97706", "recommendations": [], "showWritingLines": true, "writingLineCount": 12, "showClinicAddress": false, "showMedicineTable": false, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.966	2026-08-29 07:05:12.966	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	diagnosis	\N
1070f9ef-654b-4bee-b4b5-facc748aaf88	Standard Lab Test Order	Comprehensive lab test order form with all test categories and checkboxes	t	\N	City Diagnostic Centre					\N	022-25551235	lab@cityclinic.com	https://cityclinic.com/lab	{"fontSize": "small", "paperSize": "A4", "showNotes": false, "fontFamily": "sans", "footerText": "Report will be available in 24-48 hours", "showBorder": true, "showFooter": true, "showQRCode": true, "headerStyle": "centered", "layoutStyle": "classic", "freeFormMode": false, "primaryColor": "#dc2626", "showRxSymbol": false, "footerColumns": ["address", "phone", "email"], "headerBgColor": "#dc2626", "showDiagnosis": false, "showWatermark": false, "signatureText": "Referring Doctor:", "secondaryColor": "#fef2f2", "showHeaderLine": true, "headerLineColor": "#dc2626", "recommendations": [], "showWritingLines": true, "writingLineCount": 20, "showClinicAddress": true, "showMedicineTable": false, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": false, "showRecommendations": false}	2026-08-29 07:05:12.967	2026-08-29 07:05:12.967	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	test	\N
06278e5a-50b5-4039-8957-c30279a078cc	Quick Test Requisition	Minimal test requisition — just patient info and test checklist	f	\N	City Clinic Lab	Dr. Priya Kapoor	Dermatology	MBBS, MD Dermatology	MCI-10006	\N	022-25551234			{"fontSize": "small", "paperSize": "A5", "showNotes": false, "fontFamily": "sans", "footerText": "", "showBorder": true, "showFooter": false, "showQRCode": false, "headerStyle": "left", "layoutStyle": "minimal", "freeFormMode": false, "primaryColor": "#7c3aed", "showRxSymbol": false, "footerColumns": [], "headerBgColor": "#7c3aed", "showDiagnosis": false, "showWatermark": false, "signatureText": "Doctor:", "secondaryColor": "#ede9fe", "showHeaderLine": true, "headerLineColor": "#7c3aed", "recommendations": [], "showWritingLines": true, "writingLineCount": 15, "showClinicAddress": false, "showMedicineTable": false, "showPatientFields": true, "showSignatureLine": true, "showRegistrationNo": true, "showRecommendations": false}	2026-08-29 07:05:12.967	2026-08-29 07:05:12.967	63141eb7-fa77-4205-b36c-52c737e4a3bf	\N	test	\N
\.


--
-- Data for Name: ProcedureOrder; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."ProcedureOrder" (id, "patientId", "doctorId", "procedureName", category, notes, status, result, "resultDate", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
752f52fd-346e-4923-b3f7-8c35a666d048	fa2a1280-d1d5-4d3e-a7fa-a5fcb7d84e30	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Body Composition Analysis	General	\N	COMPLETED	BMI 28.4. Body fat 32%. Lean mass 62kg.	2026-07-22 07:05:12.92	2026-07-22 07:05:12.92	2026-08-29 07:05:12.921	\N	\N
\.


--
-- Data for Name: QueueEntry; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."QueueEntry" (id, "tokenNumber", "patientId", "doctorId", status, "queueDate", "checkedInAt", "createdAt", "updatedAt", "appointmentId", "createdById", "updatedById") FROM stdin;
1918d9c8-1643-4e02-b953-d706688218a5	1	e64187e8-6e3e-48f3-b861-6cbf1cad2edd	c95d58c6-c888-440e-8e4f-d84f4ea1487c	IN_PROGRESS	2026-08-29 00:00:00	2026-08-29 07:05:12.907	2026-08-29 07:05:12.911	2026-08-29 07:05:12.911	4061bcf8-8fb3-4709-a7a7-1b9084525fa9	\N	\N
\.


--
-- Data for Name: RadiologyOrder; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."RadiologyOrder" (id, "patientId", "doctorId", "studyName", category, notes, status, result, "resultDate", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: RefreshToken; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."RefreshToken" (id, token, "userId", "expiresAt", "revokedAt", "userAgent", "ipAddress", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: Role; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Role" (id, name, description, "isSystem", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
924b8ead-8017-43ca-a5bf-87c1837e433d	Developer	Full access to every module including Developer tools	t	2026-08-26 09:20:04.893	2026-08-29 07:05:12.723	\N	\N
70b36265-3940-4223-b6fb-1090faee93f2	Admin	Full operational access — clinical, billing, staff, and system config — excluding Organisation profile and Developer tools	t	2026-08-26 09:20:04.899	2026-08-29 07:05:12.729	\N	\N
1cce2553-01ec-463c-acaa-d6e8ac785eae	Receptionist	Front-desk: patients, appointments, queue, billing, prescriptions, dispensing	t	2026-08-29 07:03:35.088	2026-08-29 07:05:12.732	\N	\N
fa179bf6-bd60-4027-bca3-e988c4542a64	Doctor	Clinical: prescriptions, vitals, allergies, lab/radiology/procedure orders	t	2026-08-29 07:03:35.09	2026-08-29 07:05:12.734	\N	\N
5fa1011f-4be6-4759-90c8-bab9bcae224d	Nurse	Patient vitals, allergies, queue management	t	2026-08-29 07:03:35.091	2026-08-29 07:05:12.736	\N	\N
d8c33d17-1220-43e5-bbc2-c6a669d8edc4	Assistant	Support: view patients, manage queue	t	2026-08-29 07:03:35.093	2026-08-29 07:05:12.737	\N	\N
578fad41-8fb7-463d-8af2-c8023f8fb553	Pharmacist	Dispensing, prescriptions, medicine catalog, billing	t	2026-08-29 07:03:35.094	2026-08-29 07:05:12.738	\N	\N
8f166bc6-c6c8-4706-83e3-fcb69a827b08	Lab Technician	Lab orders, radiology orders, procedure orders	t	2026-08-29 07:03:35.095	2026-08-29 07:05:12.74	\N	\N
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	Doctor as Admin	Doctor with full admin access — clinical operations plus operational, billing, staff, and system management	t	2026-08-29 07:03:35.095	2026-08-29 07:05:12.74	\N	\N
\.


--
-- Data for Name: RolePermission; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."RolePermission" ("roleId", "permissionId") FROM stdin;
924b8ead-8017-43ca-a5bf-87c1837e433d	a5a765ab-4147-4f9d-add7-dd81afa30bac
924b8ead-8017-43ca-a5bf-87c1837e433d	7f29cb8a-9a75-4e2f-aa4f-024443cc0243
924b8ead-8017-43ca-a5bf-87c1837e433d	92d6fff6-b59e-462e-bcf7-62f5cf8626fc
924b8ead-8017-43ca-a5bf-87c1837e433d	19492974-7c6c-424d-90e3-415c7d90c095
924b8ead-8017-43ca-a5bf-87c1837e433d	9cee2939-5c6b-4404-8ad1-3927015c5032
924b8ead-8017-43ca-a5bf-87c1837e433d	4b14694d-0266-41f3-93c9-1eef3e428e21
924b8ead-8017-43ca-a5bf-87c1837e433d	bdc44c2f-07c6-480b-b43b-5e18aa080e7c
924b8ead-8017-43ca-a5bf-87c1837e433d	6e5b3703-f6be-4c57-b72e-d93a231f2f40
924b8ead-8017-43ca-a5bf-87c1837e433d	dd8cdabf-8427-4cd8-8056-45776e21f27c
924b8ead-8017-43ca-a5bf-87c1837e433d	ca1f7ea9-c375-427c-bf25-8ac863d22474
924b8ead-8017-43ca-a5bf-87c1837e433d	61e0404a-1b15-48e1-99ef-3f941cf03719
924b8ead-8017-43ca-a5bf-87c1837e433d	1cc2d967-7d8e-40b0-abfb-36ec5063d306
924b8ead-8017-43ca-a5bf-87c1837e433d	1d0aff5b-8ec8-4ba0-8b57-d0038da4d6f7
924b8ead-8017-43ca-a5bf-87c1837e433d	150c4a48-046c-42ea-96ad-3708685f3bff
924b8ead-8017-43ca-a5bf-87c1837e433d	3e3b399d-66e5-47b3-a391-1df58939e1a4
924b8ead-8017-43ca-a5bf-87c1837e433d	e5894154-fe9a-4d9b-a8e0-3bd0be57da80
924b8ead-8017-43ca-a5bf-87c1837e433d	6bdd9754-a44a-4a6f-8c3a-35bf2a513ae4
924b8ead-8017-43ca-a5bf-87c1837e433d	c1c5b8f6-9e10-404b-a2d4-753059268bbf
924b8ead-8017-43ca-a5bf-87c1837e433d	196a1981-329f-4aa8-8109-2aa8d2619068
924b8ead-8017-43ca-a5bf-87c1837e433d	e1b5d2a4-5b61-4f0d-b4a3-5e07421e4da2
924b8ead-8017-43ca-a5bf-87c1837e433d	b57b206f-79a7-43ba-9206-b2e1c20b16a5
924b8ead-8017-43ca-a5bf-87c1837e433d	7a771cfb-5cf0-497e-8dc2-eeefe49f3851
924b8ead-8017-43ca-a5bf-87c1837e433d	1e5931de-535c-4ded-81e2-81a5dee81d48
924b8ead-8017-43ca-a5bf-87c1837e433d	361429c4-48ca-4ae7-b3dd-5cb9d611d7b8
924b8ead-8017-43ca-a5bf-87c1837e433d	a92b6185-aa14-44aa-a345-96b717c1bb77
924b8ead-8017-43ca-a5bf-87c1837e433d	d95aef2a-597a-4431-ac59-fd24d6800b8a
924b8ead-8017-43ca-a5bf-87c1837e433d	b89b9e61-a100-4503-8e95-5241a8bbd41a
924b8ead-8017-43ca-a5bf-87c1837e433d	8e246550-5f64-4b38-8fdf-364e84834b4c
924b8ead-8017-43ca-a5bf-87c1837e433d	27f30eaf-7e76-413e-aaab-9995f043d0e8
924b8ead-8017-43ca-a5bf-87c1837e433d	28f05241-4dbd-4294-95cc-0e5b32908e5c
924b8ead-8017-43ca-a5bf-87c1837e433d	79f2be7e-97cd-4834-b402-1b18a06c55d8
924b8ead-8017-43ca-a5bf-87c1837e433d	e1163203-c622-4412-8f97-20e853054a8d
924b8ead-8017-43ca-a5bf-87c1837e433d	a2531330-edce-4d89-85fd-ae23ee5c20a1
924b8ead-8017-43ca-a5bf-87c1837e433d	759e6c73-2514-44cc-8d99-2f5c27b3269e
924b8ead-8017-43ca-a5bf-87c1837e433d	3c4fd736-8f88-44a1-9b90-8773b6de97dd
924b8ead-8017-43ca-a5bf-87c1837e433d	c28818e7-c45a-49d0-88a3-acafd7534bf2
924b8ead-8017-43ca-a5bf-87c1837e433d	2ce79964-1dfa-44e8-847c-7819603accc1
924b8ead-8017-43ca-a5bf-87c1837e433d	17e544e5-34e7-419c-af74-4216dc0173db
924b8ead-8017-43ca-a5bf-87c1837e433d	200c43ac-7a96-45fa-95c4-c0cba2b381cb
924b8ead-8017-43ca-a5bf-87c1837e433d	60ed47d4-1d40-4792-9c45-d9a421971446
924b8ead-8017-43ca-a5bf-87c1837e433d	4ec7609e-409f-4644-9917-72a2554333cc
924b8ead-8017-43ca-a5bf-87c1837e433d	5ca9f1e1-f421-4dc9-a9d6-44818028da27
924b8ead-8017-43ca-a5bf-87c1837e433d	2e4f4e7e-5a00-4532-b3c3-d69256b28010
924b8ead-8017-43ca-a5bf-87c1837e433d	eda243b0-0f86-4503-9bf3-e22522485eee
924b8ead-8017-43ca-a5bf-87c1837e433d	dae39af5-7743-480c-a7bb-15f2e7816307
924b8ead-8017-43ca-a5bf-87c1837e433d	4f4dc380-f37f-4c0a-b299-cdcb95e6f7ee
924b8ead-8017-43ca-a5bf-87c1837e433d	77d5adea-29b0-4475-bfd6-7295150d4a02
924b8ead-8017-43ca-a5bf-87c1837e433d	cb46087c-3ac0-485c-8a16-7092d2dced4a
924b8ead-8017-43ca-a5bf-87c1837e433d	8439f64c-3be6-4fc8-bac8-612529a614c9
924b8ead-8017-43ca-a5bf-87c1837e433d	f3473aef-4237-4580-88cd-4a100b60ef12
924b8ead-8017-43ca-a5bf-87c1837e433d	f8d96964-f8b9-490c-8712-f41745e56ce5
924b8ead-8017-43ca-a5bf-87c1837e433d	0cf5d1ad-b4a4-4cac-a09f-274d7d4368a5
924b8ead-8017-43ca-a5bf-87c1837e433d	49fd1070-01e7-4af0-9a39-ef93cf344911
924b8ead-8017-43ca-a5bf-87c1837e433d	62c9555d-4546-4ca2-9024-c33b9ba651c3
924b8ead-8017-43ca-a5bf-87c1837e433d	de9d9187-d0fc-4813-9733-834aeb6fedf8
924b8ead-8017-43ca-a5bf-87c1837e433d	6b435541-76e0-4124-9c36-9b046a6baf7d
924b8ead-8017-43ca-a5bf-87c1837e433d	e5fa0458-4e99-41b5-a358-ef8c352f015f
924b8ead-8017-43ca-a5bf-87c1837e433d	0feb9e25-346b-493f-b522-d3f810c56ecd
924b8ead-8017-43ca-a5bf-87c1837e433d	a3cb4eec-ab76-47c8-8a7e-57297e7f2b19
924b8ead-8017-43ca-a5bf-87c1837e433d	fc8f683b-3a0b-4786-82bc-ca9f79c33044
924b8ead-8017-43ca-a5bf-87c1837e433d	06d19100-70f8-42cb-97cc-240a1233b770
924b8ead-8017-43ca-a5bf-87c1837e433d	1483f154-b33b-4c13-8b25-8fa05d236c5b
924b8ead-8017-43ca-a5bf-87c1837e433d	0e34d364-fd8a-4d0b-80ef-9f1f548412e3
924b8ead-8017-43ca-a5bf-87c1837e433d	533e516e-0627-4811-bb0c-a7dc36d07385
924b8ead-8017-43ca-a5bf-87c1837e433d	4a1d527c-0735-401b-9423-9dd861840dda
924b8ead-8017-43ca-a5bf-87c1837e433d	8733bdb8-7115-4677-96e1-07d7cb03e466
924b8ead-8017-43ca-a5bf-87c1837e433d	0bbd7ec7-151b-4244-87b9-f115e67ea267
924b8ead-8017-43ca-a5bf-87c1837e433d	b8e19d82-6375-460b-af9a-d2c5b79b4643
924b8ead-8017-43ca-a5bf-87c1837e433d	33de2fa4-81df-4213-bac8-b7eefaea7f3b
924b8ead-8017-43ca-a5bf-87c1837e433d	c0db0ac6-bb61-410c-a5e6-00aee60bc069
924b8ead-8017-43ca-a5bf-87c1837e433d	ce820d85-6792-45bc-8171-51d73abe9bc2
924b8ead-8017-43ca-a5bf-87c1837e433d	def4b678-37f7-4db1-883d-8670b533f528
924b8ead-8017-43ca-a5bf-87c1837e433d	0bc14667-c88b-44ed-8f21-b16517814ad6
924b8ead-8017-43ca-a5bf-87c1837e433d	8be35967-04fb-4444-8489-370192ec7f6c
924b8ead-8017-43ca-a5bf-87c1837e433d	5b18ed8e-e12c-4425-a9fd-5ba95e409494
924b8ead-8017-43ca-a5bf-87c1837e433d	381dc234-e156-43d5-806f-53c89c25ee69
924b8ead-8017-43ca-a5bf-87c1837e433d	9d89778e-5509-414e-9a49-d2b8d90468d0
924b8ead-8017-43ca-a5bf-87c1837e433d	89fe8421-88bc-45b6-8674-c9af2bff4097
924b8ead-8017-43ca-a5bf-87c1837e433d	a3bef66b-d93d-41ac-81eb-4e651de12ec8
924b8ead-8017-43ca-a5bf-87c1837e433d	7e87664f-35d9-432a-b5f3-c60e09684f43
924b8ead-8017-43ca-a5bf-87c1837e433d	96f3a063-1961-47ec-993d-77402c2a36a6
924b8ead-8017-43ca-a5bf-87c1837e433d	80271763-d29b-415a-a4f8-57c921835317
924b8ead-8017-43ca-a5bf-87c1837e433d	7df5ef0b-71f2-45e7-8a81-24b62e48e537
924b8ead-8017-43ca-a5bf-87c1837e433d	beffa728-a884-4b3f-91ed-34542b2b4497
924b8ead-8017-43ca-a5bf-87c1837e433d	32abfddb-1442-4db3-aaf5-9ddda4b25ddd
924b8ead-8017-43ca-a5bf-87c1837e433d	5990c6a3-1634-4462-9506-0fd40cf0d0ac
924b8ead-8017-43ca-a5bf-87c1837e433d	819482e8-7c87-4529-9f56-a858b9ec2171
924b8ead-8017-43ca-a5bf-87c1837e433d	00d54aac-d94e-4d3f-950c-779506c63992
924b8ead-8017-43ca-a5bf-87c1837e433d	91f5764f-acae-4fc2-afeb-315d411b784b
924b8ead-8017-43ca-a5bf-87c1837e433d	b6de3e56-8110-41d6-9ee5-1dca223d6a5b
924b8ead-8017-43ca-a5bf-87c1837e433d	70752de0-2ba4-4ab0-a02e-fe637f99e569
924b8ead-8017-43ca-a5bf-87c1837e433d	280f545b-a9ee-4e2d-8382-0c0a10635db2
924b8ead-8017-43ca-a5bf-87c1837e433d	f1f0b1a5-6a13-4a0f-a366-841d0740be03
924b8ead-8017-43ca-a5bf-87c1837e433d	cacc4af8-5d93-4fb5-9e2b-99aa3b24532a
924b8ead-8017-43ca-a5bf-87c1837e433d	5ee97650-1b42-435a-a67b-5e5e55dd6969
924b8ead-8017-43ca-a5bf-87c1837e433d	aad6bd3e-74a1-4e5d-8b0b-22da38e3f372
924b8ead-8017-43ca-a5bf-87c1837e433d	478bc932-e323-4f64-9bba-d69b486c8942
924b8ead-8017-43ca-a5bf-87c1837e433d	af1ff94f-58e9-4c94-9b6c-a3ab5862fae3
924b8ead-8017-43ca-a5bf-87c1837e433d	93561b5e-9933-4e07-9ee0-4f665790397b
924b8ead-8017-43ca-a5bf-87c1837e433d	1cce472b-7dc1-4500-b0d8-51456367d41d
924b8ead-8017-43ca-a5bf-87c1837e433d	f24f8f9f-0f2f-45dd-8bde-7a4675038c0e
924b8ead-8017-43ca-a5bf-87c1837e433d	029f6010-9513-4567-9e64-81054b3a9a5d
924b8ead-8017-43ca-a5bf-87c1837e433d	1fe2b3ac-2d8e-4d24-b957-a417af2193a8
924b8ead-8017-43ca-a5bf-87c1837e433d	30083a51-b320-47a1-8807-3885c93cc6cf
924b8ead-8017-43ca-a5bf-87c1837e433d	f1b5eb76-dc2e-4f62-b88b-2508a7d2317c
924b8ead-8017-43ca-a5bf-87c1837e433d	fb8511c8-b508-41ba-b2b6-e46102d21023
924b8ead-8017-43ca-a5bf-87c1837e433d	18a07157-b253-4d05-9964-2da1e1a9eb00
924b8ead-8017-43ca-a5bf-87c1837e433d	f4882909-15b0-4c35-b2a1-999e14829592
924b8ead-8017-43ca-a5bf-87c1837e433d	e740af27-ec6f-4dc4-9ba5-b451ce3eb34f
924b8ead-8017-43ca-a5bf-87c1837e433d	610ffe17-9962-48f4-99b3-db8958c9ac48
924b8ead-8017-43ca-a5bf-87c1837e433d	116f45ea-4564-4a4e-b869-f88749b97bb1
924b8ead-8017-43ca-a5bf-87c1837e433d	63fa184e-67b9-4049-bebd-f7d3960bdc1b
924b8ead-8017-43ca-a5bf-87c1837e433d	daccf665-3a85-4dcb-8dbd-a4098bfcb3b3
924b8ead-8017-43ca-a5bf-87c1837e433d	95f5a6c2-93f8-4a17-bc9b-a93079b93825
924b8ead-8017-43ca-a5bf-87c1837e433d	a02012a1-c88b-4c22-a3d6-bb840011953b
924b8ead-8017-43ca-a5bf-87c1837e433d	fc72bf6d-9cfa-4330-b314-ba6f8e29db35
924b8ead-8017-43ca-a5bf-87c1837e433d	2a291886-e7bf-4130-b654-cc4e8093bc7f
924b8ead-8017-43ca-a5bf-87c1837e433d	d7ff07e6-a7c1-44a0-8919-d27e192a3392
924b8ead-8017-43ca-a5bf-87c1837e433d	edecde5b-9fa6-4b65-b417-7d55153884af
924b8ead-8017-43ca-a5bf-87c1837e433d	e02e3e4c-ffc0-4ad3-8295-ab02569ac69b
924b8ead-8017-43ca-a5bf-87c1837e433d	c4833b1d-014d-44fa-8c26-ca5ef7c2efe3
924b8ead-8017-43ca-a5bf-87c1837e433d	386706ad-176e-4eea-9c8a-4426439c41fb
924b8ead-8017-43ca-a5bf-87c1837e433d	6c0d4660-355d-4c20-8ffb-cfa88575ae81
924b8ead-8017-43ca-a5bf-87c1837e433d	3b1d4e87-8d68-45d9-9de2-e78ff8812ceb
924b8ead-8017-43ca-a5bf-87c1837e433d	24a76ad0-ac80-4536-ba15-12e0d80ee7cc
924b8ead-8017-43ca-a5bf-87c1837e433d	c8d857a8-771f-4661-ab37-d00d4d498d41
924b8ead-8017-43ca-a5bf-87c1837e433d	5806f3da-c972-4cac-8d0e-65f0c84804c1
924b8ead-8017-43ca-a5bf-87c1837e433d	341e2663-3d3d-4788-9618-56af99a30838
924b8ead-8017-43ca-a5bf-87c1837e433d	6e319e74-dfc4-43ec-96a4-5cf9689dcd12
924b8ead-8017-43ca-a5bf-87c1837e433d	4c553635-ccf8-45d8-9c2b-13d832548775
924b8ead-8017-43ca-a5bf-87c1837e433d	82876879-c200-48ae-945d-26912caf75e7
924b8ead-8017-43ca-a5bf-87c1837e433d	2e35281d-5d2e-4625-97d1-e63c25ad71e0
924b8ead-8017-43ca-a5bf-87c1837e433d	3ed155ce-1ca9-48dc-8c4f-7e7352308091
924b8ead-8017-43ca-a5bf-87c1837e433d	da2afd87-a5bb-40a6-bb2d-d4e8889ebc51
924b8ead-8017-43ca-a5bf-87c1837e433d	a160ce1a-55fa-4fba-a39f-968ec274f863
924b8ead-8017-43ca-a5bf-87c1837e433d	bc37cce1-b592-496c-94bd-4bfb15ea7ab1
924b8ead-8017-43ca-a5bf-87c1837e433d	64b37557-48c1-4717-8d81-0babbd03ffea
924b8ead-8017-43ca-a5bf-87c1837e433d	2a6436ae-45fc-4603-a687-5607b84b6233
924b8ead-8017-43ca-a5bf-87c1837e433d	38aa6ac1-2a89-4fbe-aa93-81341aff25b5
924b8ead-8017-43ca-a5bf-87c1837e433d	22acbf6e-fc76-4544-bbb2-42690e56de8c
924b8ead-8017-43ca-a5bf-87c1837e433d	5a65c1de-4286-4908-a809-ffe08ec63e6c
924b8ead-8017-43ca-a5bf-87c1837e433d	464722c4-8052-4891-b425-a6e8041e9b85
924b8ead-8017-43ca-a5bf-87c1837e433d	bd292c6c-d193-4122-9772-f72c3406720d
924b8ead-8017-43ca-a5bf-87c1837e433d	292f2afa-eb0c-4e59-9b4d-a28e37480681
924b8ead-8017-43ca-a5bf-87c1837e433d	8e7fd7be-1f5c-49c9-b33c-34c69ac86b85
924b8ead-8017-43ca-a5bf-87c1837e433d	22326d56-b9d6-4074-9164-02232e54465b
924b8ead-8017-43ca-a5bf-87c1837e433d	acbf8cb0-fbeb-411d-8b8a-deb5ed3832de
924b8ead-8017-43ca-a5bf-87c1837e433d	fec02527-69a6-4ec5-886f-608dc747f400
924b8ead-8017-43ca-a5bf-87c1837e433d	a3f9c2f4-0ad7-4d5b-b210-473c36cad0c2
924b8ead-8017-43ca-a5bf-87c1837e433d	a0114636-e1ab-495f-9423-7d10f30b392b
924b8ead-8017-43ca-a5bf-87c1837e433d	da0eac42-237b-4976-a997-d1965761ffd7
924b8ead-8017-43ca-a5bf-87c1837e433d	d34ab0b8-d130-4ffd-bcdb-d1b50c003f88
924b8ead-8017-43ca-a5bf-87c1837e433d	bc80d56f-0c88-4a20-8d7d-460d5acdbf80
924b8ead-8017-43ca-a5bf-87c1837e433d	7f98e29a-3306-464d-a452-e3796c969dd0
924b8ead-8017-43ca-a5bf-87c1837e433d	ed98a46f-16b5-43e1-adcd-47e7ac2ded2b
924b8ead-8017-43ca-a5bf-87c1837e433d	bcf130c1-6302-49bb-8e6a-abe087d8118c
924b8ead-8017-43ca-a5bf-87c1837e433d	33ab868c-0869-400e-a83b-2245bab2b6bc
924b8ead-8017-43ca-a5bf-87c1837e433d	30a57ba2-ca37-43d5-ada4-84cc3669f5a4
924b8ead-8017-43ca-a5bf-87c1837e433d	fac8bd41-a531-4b6d-a86c-83f0eb815231
924b8ead-8017-43ca-a5bf-87c1837e433d	e9e0094d-1902-4d85-b34f-fc576a934c6f
924b8ead-8017-43ca-a5bf-87c1837e433d	dce0f11a-0069-490d-8ee1-6e56ce56dd8d
924b8ead-8017-43ca-a5bf-87c1837e433d	d0b771e8-6b1d-48e9-a1e6-8e1f563d9422
924b8ead-8017-43ca-a5bf-87c1837e433d	edf67755-46c8-404c-a7e7-5c04c5bf20a1
924b8ead-8017-43ca-a5bf-87c1837e433d	ede85e4c-8e63-4704-90a2-b72ed388c19e
924b8ead-8017-43ca-a5bf-87c1837e433d	0842ab98-98a0-48bd-8068-ed7ae02cbd00
924b8ead-8017-43ca-a5bf-87c1837e433d	a0a17cd8-4979-4d84-a001-bf3277c96d59
924b8ead-8017-43ca-a5bf-87c1837e433d	710c428d-a35d-4e09-a511-63c57d405ccc
924b8ead-8017-43ca-a5bf-87c1837e433d	ef75fbd4-8181-4ae9-b7b9-820808ea2123
924b8ead-8017-43ca-a5bf-87c1837e433d	4bc6025f-82df-479e-9537-0cefb03a3216
924b8ead-8017-43ca-a5bf-87c1837e433d	d49df12b-bde6-439e-8742-25484e5183bc
924b8ead-8017-43ca-a5bf-87c1837e433d	ab75f8c1-d660-4ad2-8643-f4507cb25cd9
924b8ead-8017-43ca-a5bf-87c1837e433d	478f8e70-7382-4aa9-aabb-15eb574cb98a
924b8ead-8017-43ca-a5bf-87c1837e433d	dd3c40a2-f463-4ec3-99a5-a36e6ee52224
924b8ead-8017-43ca-a5bf-87c1837e433d	55dfd2b6-64e2-414d-b69b-699ce69bb385
924b8ead-8017-43ca-a5bf-87c1837e433d	c06c4b13-0b21-41c4-87ee-e5aa2b7c4bac
70b36265-3940-4223-b6fb-1090faee93f2	a5a765ab-4147-4f9d-add7-dd81afa30bac
70b36265-3940-4223-b6fb-1090faee93f2	7f29cb8a-9a75-4e2f-aa4f-024443cc0243
70b36265-3940-4223-b6fb-1090faee93f2	92d6fff6-b59e-462e-bcf7-62f5cf8626fc
70b36265-3940-4223-b6fb-1090faee93f2	19492974-7c6c-424d-90e3-415c7d90c095
70b36265-3940-4223-b6fb-1090faee93f2	9cee2939-5c6b-4404-8ad1-3927015c5032
70b36265-3940-4223-b6fb-1090faee93f2	4b14694d-0266-41f3-93c9-1eef3e428e21
70b36265-3940-4223-b6fb-1090faee93f2	bdc44c2f-07c6-480b-b43b-5e18aa080e7c
70b36265-3940-4223-b6fb-1090faee93f2	6e5b3703-f6be-4c57-b72e-d93a231f2f40
70b36265-3940-4223-b6fb-1090faee93f2	ca1f7ea9-c375-427c-bf25-8ac863d22474
70b36265-3940-4223-b6fb-1090faee93f2	61e0404a-1b15-48e1-99ef-3f941cf03719
70b36265-3940-4223-b6fb-1090faee93f2	1cc2d967-7d8e-40b0-abfb-36ec5063d306
70b36265-3940-4223-b6fb-1090faee93f2	1d0aff5b-8ec8-4ba0-8b57-d0038da4d6f7
70b36265-3940-4223-b6fb-1090faee93f2	150c4a48-046c-42ea-96ad-3708685f3bff
70b36265-3940-4223-b6fb-1090faee93f2	3e3b399d-66e5-47b3-a391-1df58939e1a4
70b36265-3940-4223-b6fb-1090faee93f2	e5894154-fe9a-4d9b-a8e0-3bd0be57da80
70b36265-3940-4223-b6fb-1090faee93f2	6bdd9754-a44a-4a6f-8c3a-35bf2a513ae4
70b36265-3940-4223-b6fb-1090faee93f2	c1c5b8f6-9e10-404b-a2d4-753059268bbf
70b36265-3940-4223-b6fb-1090faee93f2	196a1981-329f-4aa8-8109-2aa8d2619068
70b36265-3940-4223-b6fb-1090faee93f2	e1b5d2a4-5b61-4f0d-b4a3-5e07421e4da2
70b36265-3940-4223-b6fb-1090faee93f2	b57b206f-79a7-43ba-9206-b2e1c20b16a5
70b36265-3940-4223-b6fb-1090faee93f2	7a771cfb-5cf0-497e-8dc2-eeefe49f3851
70b36265-3940-4223-b6fb-1090faee93f2	1e5931de-535c-4ded-81e2-81a5dee81d48
70b36265-3940-4223-b6fb-1090faee93f2	361429c4-48ca-4ae7-b3dd-5cb9d611d7b8
70b36265-3940-4223-b6fb-1090faee93f2	a92b6185-aa14-44aa-a345-96b717c1bb77
70b36265-3940-4223-b6fb-1090faee93f2	d95aef2a-597a-4431-ac59-fd24d6800b8a
70b36265-3940-4223-b6fb-1090faee93f2	b89b9e61-a100-4503-8e95-5241a8bbd41a
70b36265-3940-4223-b6fb-1090faee93f2	8e246550-5f64-4b38-8fdf-364e84834b4c
70b36265-3940-4223-b6fb-1090faee93f2	27f30eaf-7e76-413e-aaab-9995f043d0e8
70b36265-3940-4223-b6fb-1090faee93f2	28f05241-4dbd-4294-95cc-0e5b32908e5c
70b36265-3940-4223-b6fb-1090faee93f2	79f2be7e-97cd-4834-b402-1b18a06c55d8
70b36265-3940-4223-b6fb-1090faee93f2	e1163203-c622-4412-8f97-20e853054a8d
70b36265-3940-4223-b6fb-1090faee93f2	a2531330-edce-4d89-85fd-ae23ee5c20a1
70b36265-3940-4223-b6fb-1090faee93f2	759e6c73-2514-44cc-8d99-2f5c27b3269e
70b36265-3940-4223-b6fb-1090faee93f2	3c4fd736-8f88-44a1-9b90-8773b6de97dd
70b36265-3940-4223-b6fb-1090faee93f2	c28818e7-c45a-49d0-88a3-acafd7534bf2
70b36265-3940-4223-b6fb-1090faee93f2	2ce79964-1dfa-44e8-847c-7819603accc1
70b36265-3940-4223-b6fb-1090faee93f2	17e544e5-34e7-419c-af74-4216dc0173db
70b36265-3940-4223-b6fb-1090faee93f2	200c43ac-7a96-45fa-95c4-c0cba2b381cb
70b36265-3940-4223-b6fb-1090faee93f2	60ed47d4-1d40-4792-9c45-d9a421971446
70b36265-3940-4223-b6fb-1090faee93f2	06d19100-70f8-42cb-97cc-240a1233b770
70b36265-3940-4223-b6fb-1090faee93f2	1483f154-b33b-4c13-8b25-8fa05d236c5b
70b36265-3940-4223-b6fb-1090faee93f2	0e34d364-fd8a-4d0b-80ef-9f1f548412e3
70b36265-3940-4223-b6fb-1090faee93f2	533e516e-0627-4811-bb0c-a7dc36d07385
70b36265-3940-4223-b6fb-1090faee93f2	4a1d527c-0735-401b-9423-9dd861840dda
70b36265-3940-4223-b6fb-1090faee93f2	8733bdb8-7115-4677-96e1-07d7cb03e466
70b36265-3940-4223-b6fb-1090faee93f2	b8e19d82-6375-460b-af9a-d2c5b79b4643
70b36265-3940-4223-b6fb-1090faee93f2	ce820d85-6792-45bc-8171-51d73abe9bc2
70b36265-3940-4223-b6fb-1090faee93f2	def4b678-37f7-4db1-883d-8670b533f528
70b36265-3940-4223-b6fb-1090faee93f2	0bc14667-c88b-44ed-8f21-b16517814ad6
70b36265-3940-4223-b6fb-1090faee93f2	8be35967-04fb-4444-8489-370192ec7f6c
70b36265-3940-4223-b6fb-1090faee93f2	5b18ed8e-e12c-4425-a9fd-5ba95e409494
70b36265-3940-4223-b6fb-1090faee93f2	381dc234-e156-43d5-806f-53c89c25ee69
70b36265-3940-4223-b6fb-1090faee93f2	9d89778e-5509-414e-9a49-d2b8d90468d0
70b36265-3940-4223-b6fb-1090faee93f2	89fe8421-88bc-45b6-8674-c9af2bff4097
70b36265-3940-4223-b6fb-1090faee93f2	a3bef66b-d93d-41ac-81eb-4e651de12ec8
70b36265-3940-4223-b6fb-1090faee93f2	7e87664f-35d9-432a-b5f3-c60e09684f43
70b36265-3940-4223-b6fb-1090faee93f2	96f3a063-1961-47ec-993d-77402c2a36a6
70b36265-3940-4223-b6fb-1090faee93f2	7df5ef0b-71f2-45e7-8a81-24b62e48e537
70b36265-3940-4223-b6fb-1090faee93f2	5990c6a3-1634-4462-9506-0fd40cf0d0ac
70b36265-3940-4223-b6fb-1090faee93f2	00d54aac-d94e-4d3f-950c-779506c63992
70b36265-3940-4223-b6fb-1090faee93f2	70752de0-2ba4-4ab0-a02e-fe637f99e569
70b36265-3940-4223-b6fb-1090faee93f2	280f545b-a9ee-4e2d-8382-0c0a10635db2
70b36265-3940-4223-b6fb-1090faee93f2	f1f0b1a5-6a13-4a0f-a366-841d0740be03
70b36265-3940-4223-b6fb-1090faee93f2	cacc4af8-5d93-4fb5-9e2b-99aa3b24532a
70b36265-3940-4223-b6fb-1090faee93f2	5ee97650-1b42-435a-a67b-5e5e55dd6969
70b36265-3940-4223-b6fb-1090faee93f2	aad6bd3e-74a1-4e5d-8b0b-22da38e3f372
70b36265-3940-4223-b6fb-1090faee93f2	478bc932-e323-4f64-9bba-d69b486c8942
70b36265-3940-4223-b6fb-1090faee93f2	af1ff94f-58e9-4c94-9b6c-a3ab5862fae3
70b36265-3940-4223-b6fb-1090faee93f2	93561b5e-9933-4e07-9ee0-4f665790397b
70b36265-3940-4223-b6fb-1090faee93f2	1cce472b-7dc1-4500-b0d8-51456367d41d
70b36265-3940-4223-b6fb-1090faee93f2	f24f8f9f-0f2f-45dd-8bde-7a4675038c0e
70b36265-3940-4223-b6fb-1090faee93f2	029f6010-9513-4567-9e64-81054b3a9a5d
70b36265-3940-4223-b6fb-1090faee93f2	1fe2b3ac-2d8e-4d24-b957-a417af2193a8
70b36265-3940-4223-b6fb-1090faee93f2	30083a51-b320-47a1-8807-3885c93cc6cf
70b36265-3940-4223-b6fb-1090faee93f2	f1b5eb76-dc2e-4f62-b88b-2508a7d2317c
70b36265-3940-4223-b6fb-1090faee93f2	fb8511c8-b508-41ba-b2b6-e46102d21023
70b36265-3940-4223-b6fb-1090faee93f2	18a07157-b253-4d05-9964-2da1e1a9eb00
70b36265-3940-4223-b6fb-1090faee93f2	f4882909-15b0-4c35-b2a1-999e14829592
70b36265-3940-4223-b6fb-1090faee93f2	e740af27-ec6f-4dc4-9ba5-b451ce3eb34f
70b36265-3940-4223-b6fb-1090faee93f2	610ffe17-9962-48f4-99b3-db8958c9ac48
70b36265-3940-4223-b6fb-1090faee93f2	fc72bf6d-9cfa-4330-b314-ba6f8e29db35
70b36265-3940-4223-b6fb-1090faee93f2	2a291886-e7bf-4130-b654-cc4e8093bc7f
70b36265-3940-4223-b6fb-1090faee93f2	d7ff07e6-a7c1-44a0-8919-d27e192a3392
70b36265-3940-4223-b6fb-1090faee93f2	edecde5b-9fa6-4b65-b417-7d55153884af
70b36265-3940-4223-b6fb-1090faee93f2	e02e3e4c-ffc0-4ad3-8295-ab02569ac69b
70b36265-3940-4223-b6fb-1090faee93f2	c4833b1d-014d-44fa-8c26-ca5ef7c2efe3
70b36265-3940-4223-b6fb-1090faee93f2	386706ad-176e-4eea-9c8a-4426439c41fb
70b36265-3940-4223-b6fb-1090faee93f2	6c0d4660-355d-4c20-8ffb-cfa88575ae81
70b36265-3940-4223-b6fb-1090faee93f2	3b1d4e87-8d68-45d9-9de2-e78ff8812ceb
70b36265-3940-4223-b6fb-1090faee93f2	24a76ad0-ac80-4536-ba15-12e0d80ee7cc
70b36265-3940-4223-b6fb-1090faee93f2	c8d857a8-771f-4661-ab37-d00d4d498d41
70b36265-3940-4223-b6fb-1090faee93f2	5806f3da-c972-4cac-8d0e-65f0c84804c1
70b36265-3940-4223-b6fb-1090faee93f2	341e2663-3d3d-4788-9618-56af99a30838
70b36265-3940-4223-b6fb-1090faee93f2	6e319e74-dfc4-43ec-96a4-5cf9689dcd12
70b36265-3940-4223-b6fb-1090faee93f2	4c553635-ccf8-45d8-9c2b-13d832548775
70b36265-3940-4223-b6fb-1090faee93f2	82876879-c200-48ae-945d-26912caf75e7
70b36265-3940-4223-b6fb-1090faee93f2	2e35281d-5d2e-4625-97d1-e63c25ad71e0
70b36265-3940-4223-b6fb-1090faee93f2	3ed155ce-1ca9-48dc-8c4f-7e7352308091
70b36265-3940-4223-b6fb-1090faee93f2	da2afd87-a5bb-40a6-bb2d-d4e8889ebc51
70b36265-3940-4223-b6fb-1090faee93f2	a160ce1a-55fa-4fba-a39f-968ec274f863
70b36265-3940-4223-b6fb-1090faee93f2	bc37cce1-b592-496c-94bd-4bfb15ea7ab1
70b36265-3940-4223-b6fb-1090faee93f2	64b37557-48c1-4717-8d81-0babbd03ffea
70b36265-3940-4223-b6fb-1090faee93f2	2a6436ae-45fc-4603-a687-5607b84b6233
70b36265-3940-4223-b6fb-1090faee93f2	38aa6ac1-2a89-4fbe-aa93-81341aff25b5
70b36265-3940-4223-b6fb-1090faee93f2	22acbf6e-fc76-4544-bbb2-42690e56de8c
70b36265-3940-4223-b6fb-1090faee93f2	5a65c1de-4286-4908-a809-ffe08ec63e6c
70b36265-3940-4223-b6fb-1090faee93f2	22326d56-b9d6-4074-9164-02232e54465b
70b36265-3940-4223-b6fb-1090faee93f2	acbf8cb0-fbeb-411d-8b8a-deb5ed3832de
70b36265-3940-4223-b6fb-1090faee93f2	fec02527-69a6-4ec5-886f-608dc747f400
70b36265-3940-4223-b6fb-1090faee93f2	da0eac42-237b-4976-a997-d1965761ffd7
70b36265-3940-4223-b6fb-1090faee93f2	d34ab0b8-d130-4ffd-bcdb-d1b50c003f88
70b36265-3940-4223-b6fb-1090faee93f2	bc80d56f-0c88-4a20-8d7d-460d5acdbf80
70b36265-3940-4223-b6fb-1090faee93f2	7f98e29a-3306-464d-a452-e3796c969dd0
70b36265-3940-4223-b6fb-1090faee93f2	ed98a46f-16b5-43e1-adcd-47e7ac2ded2b
70b36265-3940-4223-b6fb-1090faee93f2	bcf130c1-6302-49bb-8e6a-abe087d8118c
70b36265-3940-4223-b6fb-1090faee93f2	30a57ba2-ca37-43d5-ada4-84cc3669f5a4
70b36265-3940-4223-b6fb-1090faee93f2	dce0f11a-0069-490d-8ee1-6e56ce56dd8d
70b36265-3940-4223-b6fb-1090faee93f2	d0b771e8-6b1d-48e9-a1e6-8e1f563d9422
70b36265-3940-4223-b6fb-1090faee93f2	edf67755-46c8-404c-a7e7-5c04c5bf20a1
70b36265-3940-4223-b6fb-1090faee93f2	ede85e4c-8e63-4704-90a2-b72ed388c19e
70b36265-3940-4223-b6fb-1090faee93f2	0842ab98-98a0-48bd-8068-ed7ae02cbd00
70b36265-3940-4223-b6fb-1090faee93f2	ab75f8c1-d660-4ad2-8643-f4507cb25cd9
1cce2553-01ec-463c-acaa-d6e8ac785eae	a5a765ab-4147-4f9d-add7-dd81afa30bac
1cce2553-01ec-463c-acaa-d6e8ac785eae	7f29cb8a-9a75-4e2f-aa4f-024443cc0243
1cce2553-01ec-463c-acaa-d6e8ac785eae	92d6fff6-b59e-462e-bcf7-62f5cf8626fc
1cce2553-01ec-463c-acaa-d6e8ac785eae	19492974-7c6c-424d-90e3-415c7d90c095
1cce2553-01ec-463c-acaa-d6e8ac785eae	9cee2939-5c6b-4404-8ad1-3927015c5032
1cce2553-01ec-463c-acaa-d6e8ac785eae	4b14694d-0266-41f3-93c9-1eef3e428e21
1cce2553-01ec-463c-acaa-d6e8ac785eae	bdc44c2f-07c6-480b-b43b-5e18aa080e7c
1cce2553-01ec-463c-acaa-d6e8ac785eae	6e5b3703-f6be-4c57-b72e-d93a231f2f40
1cce2553-01ec-463c-acaa-d6e8ac785eae	dd8cdabf-8427-4cd8-8056-45776e21f27c
1cce2553-01ec-463c-acaa-d6e8ac785eae	ca1f7ea9-c375-427c-bf25-8ac863d22474
1cce2553-01ec-463c-acaa-d6e8ac785eae	61e0404a-1b15-48e1-99ef-3f941cf03719
1cce2553-01ec-463c-acaa-d6e8ac785eae	1cc2d967-7d8e-40b0-abfb-36ec5063d306
1cce2553-01ec-463c-acaa-d6e8ac785eae	150c4a48-046c-42ea-96ad-3708685f3bff
1cce2553-01ec-463c-acaa-d6e8ac785eae	e5894154-fe9a-4d9b-a8e0-3bd0be57da80
1cce2553-01ec-463c-acaa-d6e8ac785eae	6bdd9754-a44a-4a6f-8c3a-35bf2a513ae4
1cce2553-01ec-463c-acaa-d6e8ac785eae	c1c5b8f6-9e10-404b-a2d4-753059268bbf
1cce2553-01ec-463c-acaa-d6e8ac785eae	196a1981-329f-4aa8-8109-2aa8d2619068
1cce2553-01ec-463c-acaa-d6e8ac785eae	e1b5d2a4-5b61-4f0d-b4a3-5e07421e4da2
1cce2553-01ec-463c-acaa-d6e8ac785eae	b57b206f-79a7-43ba-9206-b2e1c20b16a5
1cce2553-01ec-463c-acaa-d6e8ac785eae	d95aef2a-597a-4431-ac59-fd24d6800b8a
1cce2553-01ec-463c-acaa-d6e8ac785eae	b89b9e61-a100-4503-8e95-5241a8bbd41a
1cce2553-01ec-463c-acaa-d6e8ac785eae	8e246550-5f64-4b38-8fdf-364e84834b4c
1cce2553-01ec-463c-acaa-d6e8ac785eae	27f30eaf-7e76-413e-aaab-9995f043d0e8
1cce2553-01ec-463c-acaa-d6e8ac785eae	28f05241-4dbd-4294-95cc-0e5b32908e5c
1cce2553-01ec-463c-acaa-d6e8ac785eae	79f2be7e-97cd-4834-b402-1b18a06c55d8
1cce2553-01ec-463c-acaa-d6e8ac785eae	e1163203-c622-4412-8f97-20e853054a8d
1cce2553-01ec-463c-acaa-d6e8ac785eae	a2531330-edce-4d89-85fd-ae23ee5c20a1
1cce2553-01ec-463c-acaa-d6e8ac785eae	759e6c73-2514-44cc-8d99-2f5c27b3269e
1cce2553-01ec-463c-acaa-d6e8ac785eae	3c4fd736-8f88-44a1-9b90-8773b6de97dd
1cce2553-01ec-463c-acaa-d6e8ac785eae	c28818e7-c45a-49d0-88a3-acafd7534bf2
1cce2553-01ec-463c-acaa-d6e8ac785eae	2ce79964-1dfa-44e8-847c-7819603accc1
1cce2553-01ec-463c-acaa-d6e8ac785eae	17e544e5-34e7-419c-af74-4216dc0173db
1cce2553-01ec-463c-acaa-d6e8ac785eae	200c43ac-7a96-45fa-95c4-c0cba2b381cb
1cce2553-01ec-463c-acaa-d6e8ac785eae	60ed47d4-1d40-4792-9c45-d9a421971446
1cce2553-01ec-463c-acaa-d6e8ac785eae	8733bdb8-7115-4677-96e1-07d7cb03e466
1cce2553-01ec-463c-acaa-d6e8ac785eae	ce820d85-6792-45bc-8171-51d73abe9bc2
1cce2553-01ec-463c-acaa-d6e8ac785eae	381dc234-e156-43d5-806f-53c89c25ee69
1cce2553-01ec-463c-acaa-d6e8ac785eae	fc72bf6d-9cfa-4330-b314-ba6f8e29db35
1cce2553-01ec-463c-acaa-d6e8ac785eae	c4833b1d-014d-44fa-8c26-ca5ef7c2efe3
1cce2553-01ec-463c-acaa-d6e8ac785eae	386706ad-176e-4eea-9c8a-4426439c41fb
1cce2553-01ec-463c-acaa-d6e8ac785eae	5a65c1de-4286-4908-a809-ffe08ec63e6c
1cce2553-01ec-463c-acaa-d6e8ac785eae	22326d56-b9d6-4074-9164-02232e54465b
1cce2553-01ec-463c-acaa-d6e8ac785eae	acbf8cb0-fbeb-411d-8b8a-deb5ed3832de
1cce2553-01ec-463c-acaa-d6e8ac785eae	fec02527-69a6-4ec5-886f-608dc747f400
1cce2553-01ec-463c-acaa-d6e8ac785eae	a3f9c2f4-0ad7-4d5b-b210-473c36cad0c2
1cce2553-01ec-463c-acaa-d6e8ac785eae	a0114636-e1ab-495f-9423-7d10f30b392b
fa179bf6-bd60-4027-bca3-e988c4542a64	a5a765ab-4147-4f9d-add7-dd81afa30bac
fa179bf6-bd60-4027-bca3-e988c4542a64	4b14694d-0266-41f3-93c9-1eef3e428e21
fa179bf6-bd60-4027-bca3-e988c4542a64	6e5b3703-f6be-4c57-b72e-d93a231f2f40
fa179bf6-bd60-4027-bca3-e988c4542a64	61e0404a-1b15-48e1-99ef-3f941cf03719
fa179bf6-bd60-4027-bca3-e988c4542a64	e5894154-fe9a-4d9b-a8e0-3bd0be57da80
fa179bf6-bd60-4027-bca3-e988c4542a64	6bdd9754-a44a-4a6f-8c3a-35bf2a513ae4
fa179bf6-bd60-4027-bca3-e988c4542a64	c1c5b8f6-9e10-404b-a2d4-753059268bbf
fa179bf6-bd60-4027-bca3-e988c4542a64	b57b206f-79a7-43ba-9206-b2e1c20b16a5
fa179bf6-bd60-4027-bca3-e988c4542a64	d95aef2a-597a-4431-ac59-fd24d6800b8a
fa179bf6-bd60-4027-bca3-e988c4542a64	8e246550-5f64-4b38-8fdf-364e84834b4c
fa179bf6-bd60-4027-bca3-e988c4542a64	8733bdb8-7115-4677-96e1-07d7cb03e466
fa179bf6-bd60-4027-bca3-e988c4542a64	0bbd7ec7-151b-4244-87b9-f115e67ea267
fa179bf6-bd60-4027-bca3-e988c4542a64	b8e19d82-6375-460b-af9a-d2c5b79b4643
fa179bf6-bd60-4027-bca3-e988c4542a64	ce820d85-6792-45bc-8171-51d73abe9bc2
fa179bf6-bd60-4027-bca3-e988c4542a64	def4b678-37f7-4db1-883d-8670b533f528
fa179bf6-bd60-4027-bca3-e988c4542a64	0bc14667-c88b-44ed-8f21-b16517814ad6
fa179bf6-bd60-4027-bca3-e988c4542a64	381dc234-e156-43d5-806f-53c89c25ee69
fa179bf6-bd60-4027-bca3-e988c4542a64	9d89778e-5509-414e-9a49-d2b8d90468d0
fa179bf6-bd60-4027-bca3-e988c4542a64	89fe8421-88bc-45b6-8674-c9af2bff4097
fa179bf6-bd60-4027-bca3-e988c4542a64	96f3a063-1961-47ec-993d-77402c2a36a6
fa179bf6-bd60-4027-bca3-e988c4542a64	5990c6a3-1634-4462-9506-0fd40cf0d0ac
fa179bf6-bd60-4027-bca3-e988c4542a64	70752de0-2ba4-4ab0-a02e-fe637f99e569
fa179bf6-bd60-4027-bca3-e988c4542a64	aad6bd3e-74a1-4e5d-8b0b-22da38e3f372
fa179bf6-bd60-4027-bca3-e988c4542a64	478bc932-e323-4f64-9bba-d69b486c8942
fa179bf6-bd60-4027-bca3-e988c4542a64	af1ff94f-58e9-4c94-9b6c-a3ab5862fae3
fa179bf6-bd60-4027-bca3-e988c4542a64	f24f8f9f-0f2f-45dd-8bde-7a4675038c0e
fa179bf6-bd60-4027-bca3-e988c4542a64	029f6010-9513-4567-9e64-81054b3a9a5d
fa179bf6-bd60-4027-bca3-e988c4542a64	1fe2b3ac-2d8e-4d24-b957-a417af2193a8
fa179bf6-bd60-4027-bca3-e988c4542a64	fb8511c8-b508-41ba-b2b6-e46102d21023
fa179bf6-bd60-4027-bca3-e988c4542a64	fc72bf6d-9cfa-4330-b314-ba6f8e29db35
fa179bf6-bd60-4027-bca3-e988c4542a64	5a65c1de-4286-4908-a809-ffe08ec63e6c
5fa1011f-4be6-4759-90c8-bab9bcae224d	a5a765ab-4147-4f9d-add7-dd81afa30bac
5fa1011f-4be6-4759-90c8-bab9bcae224d	4b14694d-0266-41f3-93c9-1eef3e428e21
5fa1011f-4be6-4759-90c8-bab9bcae224d	61e0404a-1b15-48e1-99ef-3f941cf03719
5fa1011f-4be6-4759-90c8-bab9bcae224d	b57b206f-79a7-43ba-9206-b2e1c20b16a5
5fa1011f-4be6-4759-90c8-bab9bcae224d	d95aef2a-597a-4431-ac59-fd24d6800b8a
5fa1011f-4be6-4759-90c8-bab9bcae224d	b89b9e61-a100-4503-8e95-5241a8bbd41a
5fa1011f-4be6-4759-90c8-bab9bcae224d	8e246550-5f64-4b38-8fdf-364e84834b4c
5fa1011f-4be6-4759-90c8-bab9bcae224d	96f3a063-1961-47ec-993d-77402c2a36a6
5fa1011f-4be6-4759-90c8-bab9bcae224d	70752de0-2ba4-4ab0-a02e-fe637f99e569
5fa1011f-4be6-4759-90c8-bab9bcae224d	aad6bd3e-74a1-4e5d-8b0b-22da38e3f372
5fa1011f-4be6-4759-90c8-bab9bcae224d	478bc932-e323-4f64-9bba-d69b486c8942
5fa1011f-4be6-4759-90c8-bab9bcae224d	af1ff94f-58e9-4c94-9b6c-a3ab5862fae3
5fa1011f-4be6-4759-90c8-bab9bcae224d	f24f8f9f-0f2f-45dd-8bde-7a4675038c0e
5fa1011f-4be6-4759-90c8-bab9bcae224d	029f6010-9513-4567-9e64-81054b3a9a5d
5fa1011f-4be6-4759-90c8-bab9bcae224d	1fe2b3ac-2d8e-4d24-b957-a417af2193a8
5fa1011f-4be6-4759-90c8-bab9bcae224d	fb8511c8-b508-41ba-b2b6-e46102d21023
d8c33d17-1220-43e5-bbc2-c6a669d8edc4	a5a765ab-4147-4f9d-add7-dd81afa30bac
d8c33d17-1220-43e5-bbc2-c6a669d8edc4	4b14694d-0266-41f3-93c9-1eef3e428e21
d8c33d17-1220-43e5-bbc2-c6a669d8edc4	61e0404a-1b15-48e1-99ef-3f941cf03719
d8c33d17-1220-43e5-bbc2-c6a669d8edc4	b57b206f-79a7-43ba-9206-b2e1c20b16a5
d8c33d17-1220-43e5-bbc2-c6a669d8edc4	d95aef2a-597a-4431-ac59-fd24d6800b8a
d8c33d17-1220-43e5-bbc2-c6a669d8edc4	8e246550-5f64-4b38-8fdf-364e84834b4c
578fad41-8fb7-463d-8af2-c8023f8fb553	a5a765ab-4147-4f9d-add7-dd81afa30bac
578fad41-8fb7-463d-8af2-c8023f8fb553	61e0404a-1b15-48e1-99ef-3f941cf03719
578fad41-8fb7-463d-8af2-c8023f8fb553	e5894154-fe9a-4d9b-a8e0-3bd0be57da80
578fad41-8fb7-463d-8af2-c8023f8fb553	b57b206f-79a7-43ba-9206-b2e1c20b16a5
578fad41-8fb7-463d-8af2-c8023f8fb553	79f2be7e-97cd-4834-b402-1b18a06c55d8
578fad41-8fb7-463d-8af2-c8023f8fb553	e1163203-c622-4412-8f97-20e853054a8d
578fad41-8fb7-463d-8af2-c8023f8fb553	a2531330-edce-4d89-85fd-ae23ee5c20a1
578fad41-8fb7-463d-8af2-c8023f8fb553	c28818e7-c45a-49d0-88a3-acafd7534bf2
578fad41-8fb7-463d-8af2-c8023f8fb553	2ce79964-1dfa-44e8-847c-7819603accc1
578fad41-8fb7-463d-8af2-c8023f8fb553	17e544e5-34e7-419c-af74-4216dc0173db
8f166bc6-c6c8-4706-83e3-fcb69a827b08	a5a765ab-4147-4f9d-add7-dd81afa30bac
8f166bc6-c6c8-4706-83e3-fcb69a827b08	4b14694d-0266-41f3-93c9-1eef3e428e21
8f166bc6-c6c8-4706-83e3-fcb69a827b08	61e0404a-1b15-48e1-99ef-3f941cf03719
8f166bc6-c6c8-4706-83e3-fcb69a827b08	8733bdb8-7115-4677-96e1-07d7cb03e466
8f166bc6-c6c8-4706-83e3-fcb69a827b08	0bbd7ec7-151b-4244-87b9-f115e67ea267
8f166bc6-c6c8-4706-83e3-fcb69a827b08	b8e19d82-6375-460b-af9a-d2c5b79b4643
8f166bc6-c6c8-4706-83e3-fcb69a827b08	ce820d85-6792-45bc-8171-51d73abe9bc2
8f166bc6-c6c8-4706-83e3-fcb69a827b08	def4b678-37f7-4db1-883d-8670b533f528
8f166bc6-c6c8-4706-83e3-fcb69a827b08	0bc14667-c88b-44ed-8f21-b16517814ad6
8f166bc6-c6c8-4706-83e3-fcb69a827b08	381dc234-e156-43d5-806f-53c89c25ee69
8f166bc6-c6c8-4706-83e3-fcb69a827b08	9d89778e-5509-414e-9a49-d2b8d90468d0
8f166bc6-c6c8-4706-83e3-fcb69a827b08	89fe8421-88bc-45b6-8674-c9af2bff4097
8f166bc6-c6c8-4706-83e3-fcb69a827b08	96f3a063-1961-47ec-993d-77402c2a36a6
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	a5a765ab-4147-4f9d-add7-dd81afa30bac
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	7f29cb8a-9a75-4e2f-aa4f-024443cc0243
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	92d6fff6-b59e-462e-bcf7-62f5cf8626fc
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	19492974-7c6c-424d-90e3-415c7d90c095
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	9cee2939-5c6b-4404-8ad1-3927015c5032
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	4b14694d-0266-41f3-93c9-1eef3e428e21
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	bdc44c2f-07c6-480b-b43b-5e18aa080e7c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	6e5b3703-f6be-4c57-b72e-d93a231f2f40
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	ca1f7ea9-c375-427c-bf25-8ac863d22474
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	61e0404a-1b15-48e1-99ef-3f941cf03719
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	1cc2d967-7d8e-40b0-abfb-36ec5063d306
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	1d0aff5b-8ec8-4ba0-8b57-d0038da4d6f7
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	150c4a48-046c-42ea-96ad-3708685f3bff
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	3e3b399d-66e5-47b3-a391-1df58939e1a4
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	e5894154-fe9a-4d9b-a8e0-3bd0be57da80
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	6bdd9754-a44a-4a6f-8c3a-35bf2a513ae4
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	c1c5b8f6-9e10-404b-a2d4-753059268bbf
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	196a1981-329f-4aa8-8109-2aa8d2619068
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	e1b5d2a4-5b61-4f0d-b4a3-5e07421e4da2
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	b57b206f-79a7-43ba-9206-b2e1c20b16a5
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	7a771cfb-5cf0-497e-8dc2-eeefe49f3851
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	1e5931de-535c-4ded-81e2-81a5dee81d48
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	361429c4-48ca-4ae7-b3dd-5cb9d611d7b8
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	a92b6185-aa14-44aa-a345-96b717c1bb77
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	d95aef2a-597a-4431-ac59-fd24d6800b8a
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	b89b9e61-a100-4503-8e95-5241a8bbd41a
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	8e246550-5f64-4b38-8fdf-364e84834b4c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	27f30eaf-7e76-413e-aaab-9995f043d0e8
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	28f05241-4dbd-4294-95cc-0e5b32908e5c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	79f2be7e-97cd-4834-b402-1b18a06c55d8
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	e1163203-c622-4412-8f97-20e853054a8d
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	a2531330-edce-4d89-85fd-ae23ee5c20a1
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	759e6c73-2514-44cc-8d99-2f5c27b3269e
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	3c4fd736-8f88-44a1-9b90-8773b6de97dd
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	c28818e7-c45a-49d0-88a3-acafd7534bf2
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	2ce79964-1dfa-44e8-847c-7819603accc1
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	17e544e5-34e7-419c-af74-4216dc0173db
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	200c43ac-7a96-45fa-95c4-c0cba2b381cb
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	60ed47d4-1d40-4792-9c45-d9a421971446
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	06d19100-70f8-42cb-97cc-240a1233b770
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	1483f154-b33b-4c13-8b25-8fa05d236c5b
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	0e34d364-fd8a-4d0b-80ef-9f1f548412e3
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	533e516e-0627-4811-bb0c-a7dc36d07385
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	4a1d527c-0735-401b-9423-9dd861840dda
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	8733bdb8-7115-4677-96e1-07d7cb03e466
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	b8e19d82-6375-460b-af9a-d2c5b79b4643
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	ce820d85-6792-45bc-8171-51d73abe9bc2
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	def4b678-37f7-4db1-883d-8670b533f528
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	0bc14667-c88b-44ed-8f21-b16517814ad6
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	8be35967-04fb-4444-8489-370192ec7f6c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	5b18ed8e-e12c-4425-a9fd-5ba95e409494
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	381dc234-e156-43d5-806f-53c89c25ee69
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	9d89778e-5509-414e-9a49-d2b8d90468d0
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	89fe8421-88bc-45b6-8674-c9af2bff4097
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	a3bef66b-d93d-41ac-81eb-4e651de12ec8
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	7e87664f-35d9-432a-b5f3-c60e09684f43
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	96f3a063-1961-47ec-993d-77402c2a36a6
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	7df5ef0b-71f2-45e7-8a81-24b62e48e537
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	5990c6a3-1634-4462-9506-0fd40cf0d0ac
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	00d54aac-d94e-4d3f-950c-779506c63992
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	70752de0-2ba4-4ab0-a02e-fe637f99e569
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	280f545b-a9ee-4e2d-8382-0c0a10635db2
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	f1f0b1a5-6a13-4a0f-a366-841d0740be03
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	cacc4af8-5d93-4fb5-9e2b-99aa3b24532a
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	5ee97650-1b42-435a-a67b-5e5e55dd6969
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	aad6bd3e-74a1-4e5d-8b0b-22da38e3f372
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	478bc932-e323-4f64-9bba-d69b486c8942
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	af1ff94f-58e9-4c94-9b6c-a3ab5862fae3
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	93561b5e-9933-4e07-9ee0-4f665790397b
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	1cce472b-7dc1-4500-b0d8-51456367d41d
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	f24f8f9f-0f2f-45dd-8bde-7a4675038c0e
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	029f6010-9513-4567-9e64-81054b3a9a5d
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	1fe2b3ac-2d8e-4d24-b957-a417af2193a8
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	30083a51-b320-47a1-8807-3885c93cc6cf
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	f1b5eb76-dc2e-4f62-b88b-2508a7d2317c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	fb8511c8-b508-41ba-b2b6-e46102d21023
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	18a07157-b253-4d05-9964-2da1e1a9eb00
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	f4882909-15b0-4c35-b2a1-999e14829592
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	e740af27-ec6f-4dc4-9ba5-b451ce3eb34f
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	610ffe17-9962-48f4-99b3-db8958c9ac48
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	fc72bf6d-9cfa-4330-b314-ba6f8e29db35
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	2a291886-e7bf-4130-b654-cc4e8093bc7f
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	d7ff07e6-a7c1-44a0-8919-d27e192a3392
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	edecde5b-9fa6-4b65-b417-7d55153884af
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	e02e3e4c-ffc0-4ad3-8295-ab02569ac69b
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	c4833b1d-014d-44fa-8c26-ca5ef7c2efe3
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	386706ad-176e-4eea-9c8a-4426439c41fb
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	6c0d4660-355d-4c20-8ffb-cfa88575ae81
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	3b1d4e87-8d68-45d9-9de2-e78ff8812ceb
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	24a76ad0-ac80-4536-ba15-12e0d80ee7cc
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	c8d857a8-771f-4661-ab37-d00d4d498d41
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	5806f3da-c972-4cac-8d0e-65f0c84804c1
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	341e2663-3d3d-4788-9618-56af99a30838
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	6e319e74-dfc4-43ec-96a4-5cf9689dcd12
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	4c553635-ccf8-45d8-9c2b-13d832548775
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	82876879-c200-48ae-945d-26912caf75e7
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	2e35281d-5d2e-4625-97d1-e63c25ad71e0
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	3ed155ce-1ca9-48dc-8c4f-7e7352308091
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	da2afd87-a5bb-40a6-bb2d-d4e8889ebc51
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	a160ce1a-55fa-4fba-a39f-968ec274f863
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	bc37cce1-b592-496c-94bd-4bfb15ea7ab1
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	64b37557-48c1-4717-8d81-0babbd03ffea
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	2a6436ae-45fc-4603-a687-5607b84b6233
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	38aa6ac1-2a89-4fbe-aa93-81341aff25b5
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	22acbf6e-fc76-4544-bbb2-42690e56de8c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	5a65c1de-4286-4908-a809-ffe08ec63e6c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	22326d56-b9d6-4074-9164-02232e54465b
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	acbf8cb0-fbeb-411d-8b8a-deb5ed3832de
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	fec02527-69a6-4ec5-886f-608dc747f400
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	da0eac42-237b-4976-a997-d1965761ffd7
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	d34ab0b8-d130-4ffd-bcdb-d1b50c003f88
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	bc80d56f-0c88-4a20-8d7d-460d5acdbf80
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	7f98e29a-3306-464d-a452-e3796c969dd0
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	ed98a46f-16b5-43e1-adcd-47e7ac2ded2b
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	bcf130c1-6302-49bb-8e6a-abe087d8118c
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	30a57ba2-ca37-43d5-ada4-84cc3669f5a4
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	dce0f11a-0069-490d-8ee1-6e56ce56dd8d
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	d0b771e8-6b1d-48e9-a1e6-8e1f563d9422
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	edf67755-46c8-404c-a7e7-5c04c5bf20a1
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	ede85e4c-8e63-4704-90a2-b72ed388c19e
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	0842ab98-98a0-48bd-8068-ed7ae02cbd00
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	ab75f8c1-d660-4ad2-8643-f4507cb25cd9
e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	0bbd7ec7-151b-4244-87b9-f115e67ea267
\.


--
-- Data for Name: RoleSidebarMenu; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."RoleSidebarMenu" ("roleId", "sidebarMenuId") FROM stdin;
70b36265-3940-4223-b6fb-1090faee93f2	2030587a-271d-4ae9-a24f-867e9ab5037a
924b8ead-8017-43ca-a5bf-87c1837e433d	2030587a-271d-4ae9-a24f-867e9ab5037a
70b36265-3940-4223-b6fb-1090faee93f2	dd69e8a0-da43-4cf7-aba4-de44087b6a8c
924b8ead-8017-43ca-a5bf-87c1837e433d	dd69e8a0-da43-4cf7-aba4-de44087b6a8c
70b36265-3940-4223-b6fb-1090faee93f2	b97c696d-df9d-43f0-99c2-f7794830de8c
924b8ead-8017-43ca-a5bf-87c1837e433d	b97c696d-df9d-43f0-99c2-f7794830de8c
924b8ead-8017-43ca-a5bf-87c1837e433d	d957be13-32e1-437d-95a5-0b3b8158b592
70b36265-3940-4223-b6fb-1090faee93f2	d957be13-32e1-437d-95a5-0b3b8158b592
70b36265-3940-4223-b6fb-1090faee93f2	b6ed915c-35a8-4416-8146-3eeed5b1cad8
924b8ead-8017-43ca-a5bf-87c1837e433d	b6ed915c-35a8-4416-8146-3eeed5b1cad8
70b36265-3940-4223-b6fb-1090faee93f2	a2360a18-b042-49e1-8ce7-81830351b7ef
924b8ead-8017-43ca-a5bf-87c1837e433d	a2360a18-b042-49e1-8ce7-81830351b7ef
70b36265-3940-4223-b6fb-1090faee93f2	5f7dbe83-b2d5-48bf-be5d-ae5c95b07204
924b8ead-8017-43ca-a5bf-87c1837e433d	5f7dbe83-b2d5-48bf-be5d-ae5c95b07204
70b36265-3940-4223-b6fb-1090faee93f2	98c5ef58-ad9f-4823-a1a1-e63ade8aa3ee
924b8ead-8017-43ca-a5bf-87c1837e433d	98c5ef58-ad9f-4823-a1a1-e63ade8aa3ee
70b36265-3940-4223-b6fb-1090faee93f2	aeb6340e-5990-4d18-b6c9-87c08ce16970
924b8ead-8017-43ca-a5bf-87c1837e433d	aeb6340e-5990-4d18-b6c9-87c08ce16970
70b36265-3940-4223-b6fb-1090faee93f2	ea36860f-5274-4227-98a8-d474fb379c48
924b8ead-8017-43ca-a5bf-87c1837e433d	ea36860f-5274-4227-98a8-d474fb379c48
70b36265-3940-4223-b6fb-1090faee93f2	a86dd8c1-0127-4b55-b546-632417fe3dd6
924b8ead-8017-43ca-a5bf-87c1837e433d	a86dd8c1-0127-4b55-b546-632417fe3dd6
70b36265-3940-4223-b6fb-1090faee93f2	b9d2d579-154f-469e-8b7d-79f305776c32
924b8ead-8017-43ca-a5bf-87c1837e433d	b9d2d579-154f-469e-8b7d-79f305776c32
70b36265-3940-4223-b6fb-1090faee93f2	58c1ebd2-67ca-492d-92c4-79e45750e0e8
924b8ead-8017-43ca-a5bf-87c1837e433d	58c1ebd2-67ca-492d-92c4-79e45750e0e8
70b36265-3940-4223-b6fb-1090faee93f2	0ce776b8-a047-4ba9-a944-a3d08d946507
924b8ead-8017-43ca-a5bf-87c1837e433d	0ce776b8-a047-4ba9-a944-a3d08d946507
70b36265-3940-4223-b6fb-1090faee93f2	690abd21-f5aa-491b-9c34-61a398364034
924b8ead-8017-43ca-a5bf-87c1837e433d	690abd21-f5aa-491b-9c34-61a398364034
70b36265-3940-4223-b6fb-1090faee93f2	f6d0fcbb-a9ea-4025-95f2-804dd98f2ab8
924b8ead-8017-43ca-a5bf-87c1837e433d	f6d0fcbb-a9ea-4025-95f2-804dd98f2ab8
70b36265-3940-4223-b6fb-1090faee93f2	0b993a3d-d0f1-4db9-bca6-2be9280aa0d8
924b8ead-8017-43ca-a5bf-87c1837e433d	0b993a3d-d0f1-4db9-bca6-2be9280aa0d8
70b36265-3940-4223-b6fb-1090faee93f2	264899ec-6543-42a5-82eb-fcd0c38a74ad
924b8ead-8017-43ca-a5bf-87c1837e433d	264899ec-6543-42a5-82eb-fcd0c38a74ad
70b36265-3940-4223-b6fb-1090faee93f2	ceb3f480-528e-49c4-ae9d-456c083516ba
924b8ead-8017-43ca-a5bf-87c1837e433d	ceb3f480-528e-49c4-ae9d-456c083516ba
70b36265-3940-4223-b6fb-1090faee93f2	e6a9a3bb-bdda-4370-916b-ec4abc8eae48
924b8ead-8017-43ca-a5bf-87c1837e433d	e6a9a3bb-bdda-4370-916b-ec4abc8eae48
70b36265-3940-4223-b6fb-1090faee93f2	c9415d06-8b61-40bf-8e02-e98af80f3cd8
924b8ead-8017-43ca-a5bf-87c1837e433d	c9415d06-8b61-40bf-8e02-e98af80f3cd8
70b36265-3940-4223-b6fb-1090faee93f2	557a7db7-2562-46e9-84da-1519f5e48e4a
924b8ead-8017-43ca-a5bf-87c1837e433d	557a7db7-2562-46e9-84da-1519f5e48e4a
70b36265-3940-4223-b6fb-1090faee93f2	5be40242-7309-487c-80ce-c28d1300f80e
924b8ead-8017-43ca-a5bf-87c1837e433d	5be40242-7309-487c-80ce-c28d1300f80e
924b8ead-8017-43ca-a5bf-87c1837e433d	834bd261-dab8-4bdf-a54f-6fd77766a7ef
924b8ead-8017-43ca-a5bf-87c1837e433d	c809e582-9653-4be1-b96f-51cfcf8ca8fa
924b8ead-8017-43ca-a5bf-87c1837e433d	4fdbc47b-e2c2-48d9-bbad-0b45f88f72b5
924b8ead-8017-43ca-a5bf-87c1837e433d	c5903e34-cfe4-41e2-9e8b-0c246772d115
70b36265-3940-4223-b6fb-1090faee93f2	c5903e34-cfe4-41e2-9e8b-0c246772d115
924b8ead-8017-43ca-a5bf-87c1837e433d	5877a4cb-7018-48c5-9881-ebf95e544e77
70b36265-3940-4223-b6fb-1090faee93f2	5877a4cb-7018-48c5-9881-ebf95e544e77
\.


--
-- Data for Name: SchemaFieldChange; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."SchemaFieldChange" (id, "modelName", "fieldName", kind, remark, "editedName", "editedType", "fieldType", "targetModel", "isRequired", "isList", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Shift; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Shift" (id, name, code, "startTime", "endTime", "breakStartTime", "breakEndTime", "isOvernight", description, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
258290ee-e5c2-43f4-8670-17ba5a367f93	Morning	MOR	08:00	14:00	11:00	11:30	f	Morning shift	t	2026-08-29 07:03:34.915	2026-08-29 07:03:34.915	\N	\N
a61f9ec0-c2aa-444a-80ce-676e0012bf81	Afternoon	AFT	14:00	20:00	17:00	17:30	f	Afternoon shift	t	2026-08-29 07:03:34.916	2026-08-29 07:03:34.916	\N	\N
421f1b30-924d-4e77-9fa3-81c307b462ba	Full Day	FUL	08:00	20:00	13:00	14:00	f	Full day shift with lunch break	t	2026-08-29 07:03:34.916	2026-08-29 07:03:34.916	\N	\N
4307fbc0-2f8e-4730-a769-79795e69106c	Evening	EVE	16:00	22:00	19:00	19:30	f	Evening OPD shift	t	2026-08-29 07:03:34.917	2026-08-29 07:03:34.917	\N	\N
\.


--
-- Data for Name: SidebarMenu; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."SidebarMenu" (id, label, path, icon, "group", "sortOrder", "isHidden", "createdAt", "updatedAt") FROM stdin;
d957be13-32e1-437d-95a5-0b3b8158b592	Dashboard	/dashboard	LayoutDashboard	Clinic	0	f	2026-08-26 09:20:05.227	2026-08-26 09:20:05.227
b6ed915c-35a8-4416-8146-3eeed5b1cad8	Appointments	/appointments	CalendarClock	Clinic	1	f	2026-08-26 09:20:05.228	2026-08-26 09:20:05.228
f32c9e03-8516-4c23-bd8f-6d796fc384d5	Appointments	/doctor-admin/appointments	CalendarClock	Clinic	1	f	2026-08-26 09:20:05.229	2026-08-26 09:20:05.229
a2360a18-b042-49e1-8ce7-81830351b7ef	Patients	/patients	Users	Clinic	2	f	2026-08-26 09:20:05.23	2026-08-26 09:20:05.23
5f7dbe83-b2d5-48bf-be5d-ae5c95b07204	Doctors	/doctors	UserCog	Clinic	3	f	2026-08-26 09:20:05.231	2026-08-26 09:20:05.231
98c5ef58-ad9f-4823-a1a1-e63ade8aa3ee	Prescriptions	/prescriptions	ClipboardList	Clinic	4	f	2026-08-26 09:20:05.231	2026-08-26 09:20:05.231
aeb6340e-5990-4d18-b6c9-87c08ce16970	Diagnoses	/diagnoses	Stethoscope	Clinic	5	f	2026-08-26 09:20:05.232	2026-08-26 09:20:05.232
ea36860f-5274-4227-98a8-d474fb379c48	Revenue by Category	/reports/revenue-by-category	BarChart3	Reports	0	f	2026-08-26 09:20:05.233	2026-08-26 09:20:05.233
a86dd8c1-0127-4b55-b546-632417fe3dd6	Outstanding Bills	/reports/outstanding-bills	AlertCircle	Reports	1	f	2026-08-26 09:20:05.234	2026-08-26 09:20:05.234
b9d2d579-154f-469e-8b7d-79f305776c32	Doctor Performance	/reports/doctor-performance	UserCog	Reports	2	f	2026-08-26 09:20:05.234	2026-08-26 09:20:05.234
58c1ebd2-67ca-492d-92c4-79e45750e0e8	Top Medicines	/reports/top-medicines	Pill	Reports	3	f	2026-08-26 09:20:05.235	2026-08-26 09:20:05.235
0ce776b8-a047-4ba9-a944-a3d08d946507	Medicine Catalog	/medicine-catalog	Pill	Pharmacy & Billing	0	f	2026-08-26 09:20:05.235	2026-08-26 09:20:05.235
690abd21-f5aa-491b-9c34-61a398364034	Billing	/billing	Receipt	Pharmacy & Billing	1	f	2026-08-26 09:20:05.236	2026-08-26 09:20:05.236
f6d0fcbb-a9ea-4025-95f2-804dd98f2ab8	Dispensing	/dispensing	Package	Pharmacy & Billing	2	f	2026-08-26 09:20:05.237	2026-08-26 09:20:05.237
0b993a3d-d0f1-4db9-bca6-2be9280aa0d8	Overview	/organisation	Building2	Organisation	0	f	2026-08-26 09:20:05.237	2026-08-26 09:20:05.237
264899ec-6543-42a5-82eb-fcd0c38a74ad	Rx Templates	/organisation/prescription-templates	FileText	Organisation	1	f	2026-08-26 09:20:05.238	2026-08-26 09:20:05.238
ceb3f480-528e-49c4-ae9d-456c083516ba	Shifts	/shifts	Clock	Organisation	2	f	2026-08-26 09:20:05.238	2026-08-26 09:20:05.238
e6a9a3bb-bdda-4370-916b-ec4abc8eae48	Addresses	/addresses	MapPin	Organisation	3	f	2026-08-26 09:20:05.239	2026-08-26 09:20:05.239
c9415d06-8b61-40bf-8e02-e98af80f3cd8	Users	/organisation/users	UserCog	Organisation	4	f	2026-08-26 09:20:05.239	2026-08-26 09:20:05.239
557a7db7-2562-46e9-84da-1519f5e48e4a	Sidebar Config	/organisation/sidebar-config	Settings	Organisation	5	f	2026-08-26 09:20:05.24	2026-08-26 09:20:05.24
5be40242-7309-487c-80ce-c28d1300f80e	Roles & Permissions	/organisation/roles	ShieldCheck	Access Control	0	f	2026-08-26 09:20:05.241	2026-08-26 09:20:05.241
834bd261-dab8-4bdf-a54f-6fd77766a7ef	Overview	/developer	Cpu	Developer	0	f	2026-08-26 09:20:05.241	2026-08-26 09:20:05.241
c809e582-9653-4be1-b96f-51cfcf8ca8fa	Modules	/developer/modules	Box	Developer	1	f	2026-08-26 09:20:05.242	2026-08-26 09:20:05.242
4fdbc47b-e2c2-48d9-bbad-0b45f88f72b5	Features	/developer/features	Zap	Developer	2	f	2026-08-26 09:20:05.242	2026-08-26 09:20:05.242
c5903e34-cfe4-41e2-9e8b-0c246772d115	Profile	/profile	User	Account	0	f	2026-08-26 09:20:05.242	2026-08-26 09:20:05.242
5877a4cb-7018-48c5-9881-ebf95e544e77	Help	/help	LifeBuoy	Account	1	f	2026-08-26 09:20:05.243	2026-08-26 09:20:05.243
2030587a-271d-4ae9-a24f-867e9ab5037a	Departments	/organisation/departments	Building2	Organisation	6	f	2026-08-29 06:13:33.379	2026-08-29 06:13:33.379
dd69e8a0-da43-4cf7-aba4-de44087b6a8c	Designations	/organisation/designations	UserCog	Organisation	7	f	2026-08-29 06:13:33.391	2026-08-29 06:13:33.391
b97c696d-df9d-43f0-99c2-f7794830de8c	Financial Years	/organisation/financial-years	CalendarClock	Organisation	8	f	2026-08-29 06:13:33.393	2026-08-29 06:13:33.393
\.


--
-- Data for Name: Specialization; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Specialization" (id, name, description, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: Unit; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."Unit" (id, name, symbol, description, "isActive", "createdAt", "updatedAt", "createdById", "updatedById") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public."User" (id, email, password, "isActive", "roleId", "createdAt", "updatedAt", username, "countryCode", "dateOfBirth", "firstName", gender, "lastName", "middleName", "mobileNumber", "profilePhotoUrl", qualification, "userableId", "userableType") FROM stdin;
63141eb7-fa77-4205-b36c-52c737e4a3bf	superadmin@clinic.com	$2b$10$Oa9nqkn/65XCIt7icdR6J.rVPkt0zSsoiNYgmozvhiova652sI1Uy	t	924b8ead-8017-43ca-a5bf-87c1837e433d	2026-08-26 09:20:05.036	2026-08-26 09:20:05.036	superadmin	+91	\N	Super	\N	Admin	\N	\N	\N	\N	\N	\N
0a17b2ce-2978-435b-8ba4-1507c16e9cee	admin@clinic.com	$2b$10$Oa9nqkn/65XCIt7icdR6J.rVPkt0zSsoiNYgmozvhiova652sI1Uy	t	70b36265-3940-4223-b6fb-1090faee93f2	2026-08-26 09:20:05.037	2026-08-26 09:20:05.037	admin	+91	\N	Admin	\N	User	\N	\N	\N	\N	\N	\N
71d3947b-3f82-4386-af9c-1d5fa07299b0	vikram.mehta@clinic.com	$2b$10$rlzSQV8xdDMIkPsXKdzTMegi8IaZbjzUCdH4wVCf4V.CJEysvxwTq	t	e7fe24fd-82cb-45bb-9f62-f8e8c40f4961	2026-08-29 07:03:35.209	2026-08-29 07:03:35.209	doctordrmehta	+91	\N	Vikram	MALE	Mehta	\N	\N	\N	\N	c95d58c6-c888-440e-8e4f-d84f4ea1487c	Doctor
80a10b95-3b19-4971-abcc-74b6469c4041	assistant@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	d8c33d17-1220-43e5-bbc2-c6a669d8edc4	2026-08-29 07:03:35.213	2026-08-29 07:03:35.213	anitapatel	+91	\N	Anita	\N	Patel	\N	\N	\N	\N	\N	\N
3f7a32c5-8a07-4217-933e-c033547c8887	receptionist@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	1cce2553-01ec-463c-acaa-d6e8ac785eae	2026-08-29 07:03:35.214	2026-08-29 07:03:35.214	frontdesk	+91	\N	Priya	FEMALE	Kapoor	\N	\N	\N	\N	\N	Receptionist
66e90951-cc5b-40c1-9edf-2ea79e2a40a1	meenakshi@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	1cce2553-01ec-463c-acaa-d6e8ac785eae	2026-08-29 07:03:35.215	2026-08-29 07:03:35.215	meenakshi	+91	\N	Meenakshi	FEMALE	Reddy	\N	\N	\N	\N	\N	Receptionist
076e5d06-9e50-46b9-ac70-39b7a42d2444	raj@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	1cce2553-01ec-463c-acaa-d6e8ac785eae	2026-08-29 07:03:35.216	2026-08-29 07:03:35.216	rajkumar	+91	\N	Raj	MALE	Kumar	\N	\N	\N	\N	\N	Receptionist
fd725731-84ba-469b-9603-17fc941f31c0	meera@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	5fa1011f-4be6-4759-90c8-bab9bcae224d	2026-08-29 07:03:35.217	2026-08-29 07:03:35.217	nursemeera	+91	\N	Meera	FEMALE	Nair	\N	\N	\N	\N	\N	Nurse
a232218e-e878-45ec-8350-91cb9c708bf8	deepak@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	5fa1011f-4be6-4759-90c8-bab9bcae224d	2026-08-29 07:03:35.218	2026-08-29 07:03:35.218	nursedeepak	+91	\N	Deepak	MALE	Yadav	\N	\N	\N	\N	\N	Nurse
f2bf0652-9676-4467-a1ad-788dc9287e55	rakesh@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	578fad41-8fb7-463d-8af2-c8023f8fb553	2026-08-29 07:03:35.218	2026-08-29 07:03:35.218	pharmrakesh	+91	\N	Rakesh	MALE	Joshi	\N	\N	\N	\N	\N	Pharmacist
39f81c41-6ea7-4fa5-9888-e73fe7fd1162	neha@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	578fad41-8fb7-463d-8af2-c8023f8fb553	2026-08-29 07:03:35.219	2026-08-29 07:03:35.219	pharmneha	+91	\N	Neha	FEMALE	Gupta	\N	\N	\N	\N	\N	Pharmacist
27aa4295-1161-4675-92dd-e075ba282117	kiran@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	8f166bc6-c6c8-4706-83e3-fcb69a827b08	2026-08-29 07:03:35.22	2026-08-29 07:03:35.22	labkiran	+91	\N	Kiran	MALE	Patil	\N	\N	\N	\N	\N	LabStaff
c13a6009-e766-4d80-b04b-7cc44796ebcc	sunita.l@clinic.com	$2b$10$nwHEWbYQN3C9og8oFwZDE.jYvHzx5DhNUN03kUgAZkCYNf128SL1i	t	8f166bc6-c6c8-4706-83e3-fcb69a827b08	2026-08-29 07:03:35.22	2026-08-29 07:03:35.22	labsunita	+91	\N	Sunita	FEMALE	Rao	\N	\N	\N	\N	\N	LabStaff
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: primesysindia
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
c8788f35-0d7d-459b-9861-e75711dcb787	f28d5fc76e3ddce0b1a7b316e1259e0d6d55999ce4f1ee3780dae54b0c04ff01	2026-08-25 15:12:03.047806+05:30	20260702112345_add_appointment_fee		\N	2026-08-25 15:12:03.047806+05:30	0
6e9150e0-e2b5-44ad-b2d1-5cb3eb021228	18a115ea95bcea85fe356baf8e7c2bfa5df5f19ba2b2e133ea20581b2ba9f00b	2026-08-25 15:12:03.564948+05:30	20260702115410_add_billing_and_clinical_models		\N	2026-08-25 15:12:03.564948+05:30	0
015434b1-cd68-4a95-961f-97204eb5a37d	4c14d60ab12ac90fd4ca764e455ffb22cc28e0f708d7e515f6ac1aa112ea1d81	2026-08-25 15:12:04.079862+05:30	20260708150607_add_organisation		\N	2026-08-25 15:12:04.079862+05:30	0
0274ad8a-4bb8-4542-b3d8-d168820694c6	37dd5cd3a8e2f9379640cb2804c40461c92fa6c2d44c9f61677a5b5b086e8995	2026-08-25 15:12:04.594556+05:30	20260709000000_add_username		\N	2026-08-25 15:12:04.594556+05:30	0
7d2092d7-9af9-42aa-8bcc-dcddc4ee284f	f50a415f83381a4ff6f0aaa1c14fef4133287b996854e3397d897e7161de85b6	2026-08-25 15:12:05.108639+05:30	20260711000000_add_bill_appointment_link		\N	2026-08-25 15:12:05.108639+05:30	0
2d2baea9-6d34-4cb2-8410-65b19bbb480a	054157deb703d84a0b0a96daa2eea6c926d647f668aa015ab609d3dc7f4d557c	2026-08-25 15:12:05.61977+05:30	20260712000000_add_appointment_cancellation_reason		\N	2026-08-25 15:12:05.61977+05:30	0
ebd92a92-586c-49b7-8f24-69aa0f312111	78f46b067ac7b8cd2d15847ab41f747547410c9827cfa7838847650aed57811e	2026-08-25 15:12:06.11696+05:30	20260713120000_sync_doctor_user_shift_schema		\N	2026-08-25 15:12:06.11696+05:30	0
b024dbdf-b692-4a1a-8a5e-2abb157b20cc	efe5d93cfa01963ad19fd82af948b8c1afdb503b08fcc9bf1109e99bdec5e431	2026-08-25 15:12:06.620512+05:30	20260718000000_token_number_string		\N	2026-08-25 15:12:06.620512+05:30	0
fc269d8c-614c-43a5-bdd6-0d42c8781192	819765f4b53d24ec591410f6a93bfc03cc3ae65797f3689cf5733715aa06877d	2026-08-25 15:12:07.143781+05:30	20260718120000_add_queue_appointment_link		\N	2026-08-25 15:12:07.143781+05:30	0
e6642b61-cd9e-4b6d-ae95-f5e94f815687	71c5bbb2b7778b491e343d8ae936c3bf54adf957f71bf490e209a15c082156f3	2026-08-25 15:12:07.646806+05:30	20260718130000_add_patient_follow_up		\N	2026-08-25 15:12:07.646806+05:30	0
2a7ea809-a3a0-43c0-9566-11fc74e02ed7	bed37da145fdf18d2d1e909367f22460459af8807080716c759a3f4d57c09133	2026-08-25 15:12:08.147367+05:30	20260718151950_add_missing_allergy_document_columns		\N	2026-08-25 15:12:08.147367+05:30	0
9dc95bca-d501-45a6-b7fe-5b8b280e3fe8	e92d4bae56b4b9c811d612ebfed11c593a59acdd371104a03f3df92097266f23	2026-08-25 15:12:08.654498+05:30	20260719000000_add_registration_fee		\N	2026-08-25 15:12:08.654498+05:30	0
d9bcd0d4-06c8-4571-9f1e-cead2d046465	a4047dae1f2fd2642fbda77e964eb8b2688cd6ae9bd5cb3e20bc148d79e6860d	2026-08-25 15:12:09.182456+05:30	20260719020000_add_diagnosis_catalog		\N	2026-08-25 15:12:09.182456+05:30	0
58f662cb-59fc-4519-b406-418b928088d3	5a1821b5abd49cf9ae4d1e67bbc82503697563996126c7218e9f1adc67a21381	2026-08-25 15:12:09.697885+05:30	20260720000000_add_appointment_reason_for_visit		\N	2026-08-25 15:12:09.697885+05:30	0
965f0df6-d53a-4c4a-9e70-e78f82508a62	95a70d62d5cd595089a737359dcdff21d84a64571e551971ceb4d9df4fde9d3c	2026-08-25 15:12:10.219154+05:30	20260721000000_add_organisation_discount_settings		\N	2026-08-25 15:12:10.219154+05:30	0
464a9561-c6c3-44c3-b124-79f38994b20c	cce6ebfaef29b5de1c439df1b74ebd91bea648a5fbf62a726de342bf52797f1d	2026-08-25 15:12:10.727464+05:30	20260822_add_audit_fields		\N	2026-08-25 15:12:10.727464+05:30	0
d244361a-de71-481d-9c90-99ad5d355f4f	4a532baf154c706509d1bc87ebf68bb53ec8c092a24c84a5101fae1e099ccc55	2026-08-25 15:12:11.239484+05:30	20260822_add_custom_module		\N	2026-08-25 15:12:11.239484+05:30	0
48ff5866-bf95-4dd5-a4c9-dd38c88ca8e5	08b683ba8612427a1219cf7d89b6b4c2ea86445c24618ef9908e15388dcf0641	2026-08-25 15:12:11.753421+05:30	20260822_add_diagnosis_systems		\N	2026-08-25 15:12:11.753421+05:30	0
0e139116-044d-446e-8c1a-0afabf889aff	44e409ea6003e0f471a3a1b3ea5ed0ec556d76f8355264666472e9032c315394	2026-08-25 15:12:12.262745+05:30	20260822_add_patient_allergy_records		\N	2026-08-25 15:12:12.262745+05:30	0
db46bce3-cc9f-4172-b2cd-f10da8792e78	b0d770c732690a37f3fb45d0381660f6b83da4ad294b69b95e4af2a8b3f7596f	2026-08-25 15:12:12.783699+05:30	20260822_add_patient_vitals		\N	2026-08-25 15:12:12.783699+05:30	0
23375947-db17-49c0-8c0d-3e5ee4f1c01f	8197ef692463853e50b2d3213f7190404327d39df9d423808866c2303e905731	2026-08-25 15:12:13.298941+05:30	20260822_add_schema_field_change		\N	2026-08-25 15:12:13.298941+05:30	0
a044cd84-2b1d-4f5a-8c38-cd52b7221c09	84089801f8e61bce96f88b6b74704614e51d3c3f9525fd099a5de4a8d7722da1	2026-08-25 15:12:13.814034+05:30	20260822_update_patient_schema		\N	2026-08-25 15:12:13.814034+05:30	0
146c18dd-a8d8-4825-ba8d-8712fa2f576b	46f9a83831bf25b2c943a09ee2d7438e6d1a141b3c6bf83052b60a3b889a754a	2026-08-25 15:12:14.347344+05:30	20260823_add_medical_status		\N	2026-08-25 15:12:14.347344+05:30	0
00617ceb-6887-45ff-9132-2b406e013bcd	3a70ee34d50d6948c38ea5cb005228c95904a1b538e3a17489cc0d01a4d6ce0e	2026-08-25 15:12:14.865263+05:30	20260823000000_add_financial_year		\N	2026-08-25 15:12:14.865263+05:30	0
b8f4ced3-a41e-490c-b040-ec21150e8501	e877d9df6891d1e78812c6a73460bf97c7fbd5a948657624a0af859049cffab4	2026-08-25 15:12:15.387435+05:30	20260823010000_add_prescription_template		\N	2026-08-25 15:12:15.387435+05:30	0
8d0ed7fe-6b56-4de9-b7eb-4f07c1738ec0	034729e31857156e21ab8eba4da43a8223fa453441a94f3a989d8d8281b55fa1	2026-08-25 15:12:15.89945+05:30	20260823020000_add_template_type		\N	2026-08-25 15:12:15.89945+05:30	0
7754609e-e575-44dd-a87a-27d3aa64cc8d	a2e03e3c4511a97afcbb9248767eb493d024890ef5d346bda808926e1c5e1614	2026-08-25 15:12:16.412115+05:30	20260824000000_remove_doctor_verification_status		\N	2026-08-25 15:12:16.412115+05:30	0
6d06c41e-a4ab-439d-a12c-1074558a654e	f2079d19870eff730a55c79c5e0329c1618fe70dcdfd6a7cad34a92a56027473	2026-08-25 15:12:16.907469+05:30	20260824100000_remove_patient_phone_unique		\N	2026-08-25 15:12:16.907469+05:30	0
f1681365-eaff-4eb1-b820-5025b607d441	7127bcd9cc3d2ac975f82689410a5fbe4b58382890dd6280dfecf2f64465339f	2026-08-25 15:12:17.408837+05:30	20260824110000_add_prescription_versioning		\N	2026-08-25 15:12:17.408837+05:30	0
a6d56ab6-3106-49c9-be29-b4dc072c5bc5	174bd3adf0643481aa3eee64b12f280b345c4c59f09c9883ab1df59b7ce4130f	2026-08-25 15:12:17.911373+05:30	20260825004744_add_prescription_template_doctor_assignment		\N	2026-08-25 15:12:17.911373+05:30	0
872e8e43-dca2-4d55-9f45-b4048c0c814a	b0ea3bc7d96836b14fbc8def0ad949f2187573b41f387f35ca1a6ac30014926e	2026-08-25 15:12:18.424683+05:30	20260825005213_add_appointment_id_to_patient_vitals		\N	2026-08-25 15:12:18.424683+05:30	0
378dead8-cefc-455a-88e8-33709bd4e0d0	bc4053d508d31d4ac8b48c80b10842ee5b62cda08995cb7784196f1bba48c5e7	2026-08-25 15:12:22.674908+05:30	20260825094036_add_specialization_and_sidebar_menu	\N	\N	2026-08-25 15:12:22.659669+05:30	1
a88765b8-cb82-478e-b759-b1ad98ddad68	138f0ad173c06bbca9e6eae1d1db120240984f3d12856976da83b6327e763a33	2026-08-29 10:18:32.071742+05:30	20260829044814_add_medicine_groups_units_stock	\N	\N	2026-08-29 10:18:32.049346+05:30	1
e67b8b75-7df6-493f-98fc-1756531e59d2	9cf3e397c76d102befa0dcf8e0caca7c570e0ad41070a1f799c9d10600dd2dcc	2026-08-29 10:49:17.979592+05:30	20260829051912_add_department_designation_financial_year_doctor_joins	\N	\N	2026-08-29 10:49:17.948705+05:30	1
45cecf47-00c6-4671-8a40-d5a3d4c15c9e	73c5865005f93e4b0294b1b69032dc70d95efec37ce6a43b65a1e3d1e207c944	2026-08-29 11:24:37.930202+05:30	20260829055414_rename_appointment_fee_to_amount	\N	\N	2026-08-29 11:24:37.928241+05:30	1
4081f658-1ab9-4c99-a5ae-0c53f271b400	f2396884e529b10c96addcd09846d4a4c31b7c40c91b06e122cf7679b63ce198	2026-08-29 12:29:26.962366+05:30	20260829065921_add_blood_group	\N	\N	2026-08-29 12:29:26.941024+05:30	1
\.


--
-- Name: Address Address_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_pkey" PRIMARY KEY (id);


--
-- Name: Allergy Allergy_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Allergy"
    ADD CONSTRAINT "Allergy_pkey" PRIMARY KEY (id);


--
-- Name: Appointment Appointment_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_pkey" PRIMARY KEY (id);


--
-- Name: BillItem BillItem_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_pkey" PRIMARY KEY (id);


--
-- Name: Bill Bill_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_pkey" PRIMARY KEY (id);


--
-- Name: BloodGroup BloodGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."BloodGroup"
    ADD CONSTRAINT "BloodGroup_pkey" PRIMARY KEY (id);


--
-- Name: CustomModule CustomModule_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."CustomModule"
    ADD CONSTRAINT "CustomModule_pkey" PRIMARY KEY (id);


--
-- Name: Department Department_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_pkey" PRIMARY KEY (id);


--
-- Name: Designation Designation_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Designation"
    ADD CONSTRAINT "Designation_pkey" PRIMARY KEY (id);


--
-- Name: DiagnosisSystem DiagnosisSystem_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DiagnosisSystem"
    ADD CONSTRAINT "DiagnosisSystem_pkey" PRIMARY KEY (id);


--
-- Name: Diagnosis Diagnosis_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_pkey" PRIMARY KEY (id);


--
-- Name: Dispensing Dispensing_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Dispensing"
    ADD CONSTRAINT "Dispensing_pkey" PRIMARY KEY (id);


--
-- Name: DoctorDepartment DoctorDepartment_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorDepartment"
    ADD CONSTRAINT "DoctorDepartment_pkey" PRIMARY KEY (id);


--
-- Name: DoctorSpecialization DoctorSpecialization_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorSpecialization"
    ADD CONSTRAINT "DoctorSpecialization_pkey" PRIMARY KEY (id);


--
-- Name: Doctor Doctor_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: EmployeeSchedule EmployeeSchedule_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."EmployeeSchedule"
    ADD CONSTRAINT "EmployeeSchedule_pkey" PRIMARY KEY (id);


--
-- Name: FinancialYear FinancialYear_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."FinancialYear"
    ADD CONSTRAINT "FinancialYear_pkey" PRIMARY KEY (id);


--
-- Name: LabOrder LabOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_pkey" PRIMARY KEY (id);


--
-- Name: MedicineGroup MedicineGroup_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."MedicineGroup"
    ADD CONSTRAINT "MedicineGroup_pkey" PRIMARY KEY (id);


--
-- Name: Medicine Medicine_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_pkey" PRIMARY KEY (id);


--
-- Name: Organisation Organisation_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Organisation"
    ADD CONSTRAINT "Organisation_pkey" PRIMARY KEY (id);


--
-- Name: PatientAllergyRecord PatientAllergyRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergyRecord"
    ADD CONSTRAINT "PatientAllergyRecord_pkey" PRIMARY KEY (id);


--
-- Name: PatientAllergy PatientAllergy_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergy"
    ADD CONSTRAINT "PatientAllergy_pkey" PRIMARY KEY (id);


--
-- Name: PatientVitals PatientVitals_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientVitals"
    ADD CONSTRAINT "PatientVitals_pkey" PRIMARY KEY (id);


--
-- Name: Patient Patient_patientCode_key; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_patientCode_key" UNIQUE ("patientCode");


--
-- Name: Patient Patient_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_pkey" PRIMARY KEY (id);


--
-- Name: Permission Permission_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_pkey" PRIMARY KEY (id);


--
-- Name: PrescriptionHistory PrescriptionHistory_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionHistory"
    ADD CONSTRAINT "PrescriptionHistory_pkey" PRIMARY KEY (id);


--
-- Name: PrescriptionItem PrescriptionItem_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_pkey" PRIMARY KEY (id);


--
-- Name: PrescriptionTemplate PrescriptionTemplate_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionTemplate"
    ADD CONSTRAINT "PrescriptionTemplate_pkey" PRIMARY KEY (id);


--
-- Name: Prescription Prescription_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_pkey" PRIMARY KEY (id);


--
-- Name: ProcedureOrder ProcedureOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."ProcedureOrder"
    ADD CONSTRAINT "ProcedureOrder_pkey" PRIMARY KEY (id);


--
-- Name: QueueEntry QueueEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."QueueEntry"
    ADD CONSTRAINT "QueueEntry_pkey" PRIMARY KEY (id);


--
-- Name: RadiologyOrder RadiologyOrder_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RadiologyOrder"
    ADD CONSTRAINT "RadiologyOrder_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: RolePermission RolePermission_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("roleId", "permissionId");


--
-- Name: RoleSidebarMenu RoleSidebarMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RoleSidebarMenu"
    ADD CONSTRAINT "RoleSidebarMenu_pkey" PRIMARY KEY ("roleId", "sidebarMenuId");


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: SchemaFieldChange SchemaFieldChange_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."SchemaFieldChange"
    ADD CONSTRAINT "SchemaFieldChange_pkey" PRIMARY KEY (id);


--
-- Name: Shift Shift_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_pkey" PRIMARY KEY (id);


--
-- Name: SidebarMenu SidebarMenu_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."SidebarMenu"
    ADD CONSTRAINT "SidebarMenu_pkey" PRIMARY KEY (id);


--
-- Name: Specialization Specialization_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Specialization"
    ADD CONSTRAINT "Specialization_pkey" PRIMARY KEY (id);


--
-- Name: Unit Unit_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Unit"
    ADD CONSTRAINT "Unit_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: Address_addressableType_addressableId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Address_addressableType_addressableId_idx" ON public."Address" USING btree ("addressableType", "addressableId");


--
-- Name: Address_addressableType_addressableId_isPrimary_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Address_addressableType_addressableId_isPrimary_idx" ON public."Address" USING btree ("addressableType", "addressableId", "isPrimary");


--
-- Name: Address_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Address_createdById_idx" ON public."Address" USING btree ("createdById");


--
-- Name: Address_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Address_updatedById_idx" ON public."Address" USING btree ("updatedById");


--
-- Name: Allergy_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Allergy_name_key" ON public."Allergy" USING btree (name);


--
-- Name: Appointment_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Appointment_createdById_idx" ON public."Appointment" USING btree ("createdById");


--
-- Name: Appointment_date_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Appointment_date_idx" ON public."Appointment" USING btree (date);


--
-- Name: Appointment_doctorId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Appointment_doctorId_idx" ON public."Appointment" USING btree ("doctorId");


--
-- Name: Appointment_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Appointment_patientId_idx" ON public."Appointment" USING btree ("patientId");


--
-- Name: Appointment_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Appointment_updatedById_idx" ON public."Appointment" USING btree ("updatedById");


--
-- Name: BillItem_billId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "BillItem_billId_idx" ON public."BillItem" USING btree ("billId");


--
-- Name: BillItem_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "BillItem_createdById_idx" ON public."BillItem" USING btree ("createdById");


--
-- Name: BillItem_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "BillItem_updatedById_idx" ON public."BillItem" USING btree ("updatedById");


--
-- Name: Bill_appointmentId_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Bill_appointmentId_key" ON public."Bill" USING btree ("appointmentId");


--
-- Name: Bill_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Bill_createdById_idx" ON public."Bill" USING btree ("createdById");


--
-- Name: Bill_invoiceNo_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Bill_invoiceNo_idx" ON public."Bill" USING btree ("invoiceNo");


--
-- Name: Bill_invoiceNo_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Bill_invoiceNo_key" ON public."Bill" USING btree ("invoiceNo");


--
-- Name: Bill_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Bill_patientId_idx" ON public."Bill" USING btree ("patientId");


--
-- Name: Bill_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Bill_updatedById_idx" ON public."Bill" USING btree ("updatedById");


--
-- Name: BloodGroup_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "BloodGroup_createdById_idx" ON public."BloodGroup" USING btree ("createdById");


--
-- Name: BloodGroup_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "BloodGroup_name_key" ON public."BloodGroup" USING btree (name);


--
-- Name: BloodGroup_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "BloodGroup_updatedById_idx" ON public."BloodGroup" USING btree ("updatedById");


--
-- Name: Department_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Department_createdById_idx" ON public."Department" USING btree ("createdById");


--
-- Name: Department_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Department_name_key" ON public."Department" USING btree (name);


--
-- Name: Department_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Department_updatedById_idx" ON public."Department" USING btree ("updatedById");


--
-- Name: Designation_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Designation_createdById_idx" ON public."Designation" USING btree ("createdById");


--
-- Name: Designation_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Designation_name_key" ON public."Designation" USING btree (name);


--
-- Name: Designation_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Designation_updatedById_idx" ON public."Designation" USING btree ("updatedById");


--
-- Name: DiagnosisSystem_code_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "DiagnosisSystem_code_idx" ON public."DiagnosisSystem" USING btree (code);


--
-- Name: DiagnosisSystem_code_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "DiagnosisSystem_code_key" ON public."DiagnosisSystem" USING btree (code);


--
-- Name: DiagnosisSystem_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "DiagnosisSystem_createdById_idx" ON public."DiagnosisSystem" USING btree ("createdById");


--
-- Name: DiagnosisSystem_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "DiagnosisSystem_updatedById_idx" ON public."DiagnosisSystem" USING btree ("updatedById");


--
-- Name: Diagnosis_code_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Diagnosis_code_idx" ON public."Diagnosis" USING btree (code);


--
-- Name: Diagnosis_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Diagnosis_createdById_idx" ON public."Diagnosis" USING btree ("createdById");


--
-- Name: Diagnosis_diagnosisSystemId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Diagnosis_diagnosisSystemId_idx" ON public."Diagnosis" USING btree ("diagnosisSystemId");


--
-- Name: Diagnosis_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Diagnosis_updatedById_idx" ON public."Diagnosis" USING btree ("updatedById");


--
-- Name: Dispensing_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Dispensing_createdById_idx" ON public."Dispensing" USING btree ("createdById");


--
-- Name: Dispensing_medicineId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Dispensing_medicineId_idx" ON public."Dispensing" USING btree ("medicineId");


--
-- Name: Dispensing_prescriptionId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Dispensing_prescriptionId_idx" ON public."Dispensing" USING btree ("prescriptionId");


--
-- Name: Dispensing_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Dispensing_updatedById_idx" ON public."Dispensing" USING btree ("updatedById");


--
-- Name: DoctorDepartment_departmentId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "DoctorDepartment_departmentId_idx" ON public."DoctorDepartment" USING btree ("departmentId");


--
-- Name: DoctorDepartment_doctorId_departmentId_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "DoctorDepartment_doctorId_departmentId_key" ON public."DoctorDepartment" USING btree ("doctorId", "departmentId");


--
-- Name: DoctorDepartment_doctorId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "DoctorDepartment_doctorId_idx" ON public."DoctorDepartment" USING btree ("doctorId");


--
-- Name: DoctorSpecialization_doctorId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "DoctorSpecialization_doctorId_idx" ON public."DoctorSpecialization" USING btree ("doctorId");


--
-- Name: DoctorSpecialization_doctorId_specializationId_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "DoctorSpecialization_doctorId_specializationId_key" ON public."DoctorSpecialization" USING btree ("doctorId", "specializationId");


--
-- Name: DoctorSpecialization_specializationId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "DoctorSpecialization_specializationId_idx" ON public."DoctorSpecialization" USING btree ("specializationId");


--
-- Name: Doctor_medicalRegistrationNo_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Doctor_medicalRegistrationNo_key" ON public."Doctor" USING btree ("medicalRegistrationNo");


--
-- Name: Doctor_specialization_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Doctor_specialization_idx" ON public."Doctor" USING btree (specialization);


--
-- Name: Document_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Document_createdById_idx" ON public."Document" USING btree ("createdById");


--
-- Name: Document_documentableType_documentableId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Document_documentableType_documentableId_idx" ON public."Document" USING btree ("documentableType", "documentableId");


--
-- Name: Document_documentableType_documentableId_isPrimary_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Document_documentableType_documentableId_isPrimary_idx" ON public."Document" USING btree ("documentableType", "documentableId", "isPrimary");


--
-- Name: Document_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Document_updatedById_idx" ON public."Document" USING btree ("updatedById");


--
-- Name: EmployeeSchedule_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "EmployeeSchedule_createdById_idx" ON public."EmployeeSchedule" USING btree ("createdById");


--
-- Name: EmployeeSchedule_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "EmployeeSchedule_updatedById_idx" ON public."EmployeeSchedule" USING btree ("updatedById");


--
-- Name: FinancialYear_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "FinancialYear_createdById_idx" ON public."FinancialYear" USING btree ("createdById");


--
-- Name: FinancialYear_isCurrent_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "FinancialYear_isCurrent_idx" ON public."FinancialYear" USING btree ("isCurrent");


--
-- Name: FinancialYear_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "FinancialYear_name_key" ON public."FinancialYear" USING btree (name);


--
-- Name: FinancialYear_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "FinancialYear_updatedById_idx" ON public."FinancialYear" USING btree ("updatedById");


--
-- Name: LabOrder_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "LabOrder_createdById_idx" ON public."LabOrder" USING btree ("createdById");


--
-- Name: LabOrder_doctorId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "LabOrder_doctorId_idx" ON public."LabOrder" USING btree ("doctorId");


--
-- Name: LabOrder_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "LabOrder_patientId_idx" ON public."LabOrder" USING btree ("patientId");


--
-- Name: LabOrder_status_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "LabOrder_status_idx" ON public."LabOrder" USING btree (status);


--
-- Name: LabOrder_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "LabOrder_updatedById_idx" ON public."LabOrder" USING btree ("updatedById");


--
-- Name: MedicineGroup_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "MedicineGroup_createdById_idx" ON public."MedicineGroup" USING btree ("createdById");


--
-- Name: MedicineGroup_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "MedicineGroup_name_key" ON public."MedicineGroup" USING btree (name);


--
-- Name: MedicineGroup_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "MedicineGroup_updatedById_idx" ON public."MedicineGroup" USING btree ("updatedById");


--
-- Name: Medicine_alias_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Medicine_alias_idx" ON public."Medicine" USING btree (alias);


--
-- Name: Medicine_genericName_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Medicine_genericName_idx" ON public."Medicine" USING btree ("genericName");


--
-- Name: Medicine_groupId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Medicine_groupId_idx" ON public."Medicine" USING btree ("groupId");


--
-- Name: Medicine_name_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Medicine_name_idx" ON public."Medicine" USING btree (name);


--
-- Name: Medicine_unitId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Medicine_unitId_idx" ON public."Medicine" USING btree ("unitId");


--
-- Name: PatientAllergyRecord_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientAllergyRecord_createdById_idx" ON public."PatientAllergyRecord" USING btree ("createdById");


--
-- Name: PatientAllergyRecord_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientAllergyRecord_patientId_idx" ON public."PatientAllergyRecord" USING btree ("patientId");


--
-- Name: PatientAllergyRecord_patientId_status_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientAllergyRecord_patientId_status_idx" ON public."PatientAllergyRecord" USING btree ("patientId", status);


--
-- Name: PatientAllergyRecord_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientAllergyRecord_updatedById_idx" ON public."PatientAllergyRecord" USING btree ("updatedById");


--
-- Name: PatientAllergy_allergyId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientAllergy_allergyId_idx" ON public."PatientAllergy" USING btree ("allergyId");


--
-- Name: PatientAllergy_patientId_allergyId_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "PatientAllergy_patientId_allergyId_key" ON public."PatientAllergy" USING btree ("patientId", "allergyId");


--
-- Name: PatientAllergy_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientAllergy_patientId_idx" ON public."PatientAllergy" USING btree ("patientId");


--
-- Name: PatientVitals_appointmentId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientVitals_appointmentId_idx" ON public."PatientVitals" USING btree ("appointmentId");


--
-- Name: PatientVitals_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientVitals_createdById_idx" ON public."PatientVitals" USING btree ("createdById");


--
-- Name: PatientVitals_patientId_createdAt_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientVitals_patientId_createdAt_idx" ON public."PatientVitals" USING btree ("patientId", "createdAt");


--
-- Name: PatientVitals_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PatientVitals_patientId_idx" ON public."PatientVitals" USING btree ("patientId");


--
-- Name: Patient_firstName_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Patient_firstName_idx" ON public."Patient" USING btree ("firstName");


--
-- Name: Patient_lastName_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Patient_lastName_idx" ON public."Patient" USING btree ("lastName");


--
-- Name: Patient_patientCode_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Patient_patientCode_idx" ON public."Patient" USING btree ("patientCode");


--
-- Name: Permission_resource_action_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Permission_resource_action_key" ON public."Permission" USING btree (resource, action);


--
-- Name: PrescriptionHistory_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PrescriptionHistory_createdById_idx" ON public."PrescriptionHistory" USING btree ("createdById");


--
-- Name: PrescriptionHistory_prescriptionId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PrescriptionHistory_prescriptionId_idx" ON public."PrescriptionHistory" USING btree ("prescriptionId");


--
-- Name: PrescriptionHistory_prescriptionId_version_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PrescriptionHistory_prescriptionId_version_idx" ON public."PrescriptionHistory" USING btree ("prescriptionId", version);


--
-- Name: PrescriptionItem_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PrescriptionItem_createdById_idx" ON public."PrescriptionItem" USING btree ("createdById");


--
-- Name: PrescriptionItem_prescriptionId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PrescriptionItem_prescriptionId_idx" ON public."PrescriptionItem" USING btree ("prescriptionId");


--
-- Name: PrescriptionItem_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PrescriptionItem_updatedById_idx" ON public."PrescriptionItem" USING btree ("updatedById");


--
-- Name: PrescriptionTemplate_doctorId_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "PrescriptionTemplate_doctorId_key" ON public."PrescriptionTemplate" USING btree ("doctorId");


--
-- Name: PrescriptionTemplate_isDefault_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "PrescriptionTemplate_isDefault_idx" ON public."PrescriptionTemplate" USING btree ("isDefault");


--
-- Name: Prescription_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Prescription_createdById_idx" ON public."Prescription" USING btree ("createdById");


--
-- Name: Prescription_doctorId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Prescription_doctorId_idx" ON public."Prescription" USING btree ("doctorId");


--
-- Name: Prescription_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Prescription_patientId_idx" ON public."Prescription" USING btree ("patientId");


--
-- Name: Prescription_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Prescription_updatedById_idx" ON public."Prescription" USING btree ("updatedById");


--
-- Name: ProcedureOrder_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "ProcedureOrder_createdById_idx" ON public."ProcedureOrder" USING btree ("createdById");


--
-- Name: ProcedureOrder_doctorId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "ProcedureOrder_doctorId_idx" ON public."ProcedureOrder" USING btree ("doctorId");


--
-- Name: ProcedureOrder_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "ProcedureOrder_patientId_idx" ON public."ProcedureOrder" USING btree ("patientId");


--
-- Name: ProcedureOrder_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "ProcedureOrder_updatedById_idx" ON public."ProcedureOrder" USING btree ("updatedById");


--
-- Name: QueueEntry_appointmentId_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "QueueEntry_appointmentId_key" ON public."QueueEntry" USING btree ("appointmentId");


--
-- Name: QueueEntry_doctorId_queueDate_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "QueueEntry_doctorId_queueDate_idx" ON public."QueueEntry" USING btree ("doctorId", "queueDate");


--
-- Name: QueueEntry_doctorId_queueDate_tokenNumber_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "QueueEntry_doctorId_queueDate_tokenNumber_key" ON public."QueueEntry" USING btree ("doctorId", "queueDate", "tokenNumber");


--
-- Name: QueueEntry_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "QueueEntry_patientId_idx" ON public."QueueEntry" USING btree ("patientId");


--
-- Name: RadiologyOrder_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "RadiologyOrder_createdById_idx" ON public."RadiologyOrder" USING btree ("createdById");


--
-- Name: RadiologyOrder_doctorId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "RadiologyOrder_doctorId_idx" ON public."RadiologyOrder" USING btree ("doctorId");


--
-- Name: RadiologyOrder_patientId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "RadiologyOrder_patientId_idx" ON public."RadiologyOrder" USING btree ("patientId");


--
-- Name: RadiologyOrder_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "RadiologyOrder_updatedById_idx" ON public."RadiologyOrder" USING btree ("updatedById");


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: RefreshToken_userId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "RefreshToken_userId_idx" ON public."RefreshToken" USING btree ("userId");


--
-- Name: Role_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Role_name_key" ON public."Role" USING btree (name);


--
-- Name: SchemaFieldChange_modelName_fieldName_kind_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "SchemaFieldChange_modelName_fieldName_kind_key" ON public."SchemaFieldChange" USING btree ("modelName", "fieldName", kind);


--
-- Name: SchemaFieldChange_modelName_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "SchemaFieldChange_modelName_idx" ON public."SchemaFieldChange" USING btree ("modelName");


--
-- Name: Shift_code_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Shift_code_key" ON public."Shift" USING btree (code);


--
-- Name: SidebarMenu_path_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "SidebarMenu_path_key" ON public."SidebarMenu" USING btree (path);


--
-- Name: Specialization_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Specialization_createdById_idx" ON public."Specialization" USING btree ("createdById");


--
-- Name: Specialization_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Specialization_name_key" ON public."Specialization" USING btree (name);


--
-- Name: Specialization_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Specialization_updatedById_idx" ON public."Specialization" USING btree ("updatedById");


--
-- Name: Unit_createdById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Unit_createdById_idx" ON public."Unit" USING btree ("createdById");


--
-- Name: Unit_name_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "Unit_name_key" ON public."Unit" USING btree (name);


--
-- Name: Unit_updatedById_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "Unit_updatedById_idx" ON public."Unit" USING btree ("updatedById");


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_userableType_userableId_idx; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX "User_userableType_userableId_idx" ON public."User" USING btree ("userableType", "userableId");


--
-- Name: User_username_key; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE UNIQUE INDEX "User_username_key" ON public."User" USING btree (username);


--
-- Name: emp_sched_type_id; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX emp_sched_type_id ON public."EmployeeSchedule" USING btree ("employeeSchedulableType", "employeeSchedulableId");


--
-- Name: emp_sched_type_id_dow; Type: INDEX; Schema: public; Owner: primesysindia
--

CREATE INDEX emp_sched_type_id_dow ON public."EmployeeSchedule" USING btree ("employeeSchedulableType", "employeeSchedulableId", "dayOfWeek");


--
-- Name: Address Address_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Address Address_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Address"
    ADD CONSTRAINT "Address_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Allergy Allergy_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Allergy"
    ADD CONSTRAINT "Allergy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Allergy Allergy_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Allergy"
    ADD CONSTRAINT "Allergy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Appointment Appointment_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Appointment Appointment_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Appointment Appointment_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Appointment"
    ADD CONSTRAINT "Appointment_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BillItem BillItem_billId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_billId_fkey" FOREIGN KEY ("billId") REFERENCES public."Bill"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: BillItem BillItem_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BillItem BillItem_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."BillItem"
    ADD CONSTRAINT "BillItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bill Bill_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bill Bill_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bill Bill_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Bill Bill_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Bill"
    ADD CONSTRAINT "Bill_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BloodGroup BloodGroup_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."BloodGroup"
    ADD CONSTRAINT "BloodGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: BloodGroup BloodGroup_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."BloodGroup"
    ADD CONSTRAINT "BloodGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Department Department_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Department Department_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Department"
    ADD CONSTRAINT "Department_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Designation Designation_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Designation"
    ADD CONSTRAINT "Designation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Designation Designation_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Designation"
    ADD CONSTRAINT "Designation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DiagnosisSystem DiagnosisSystem_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DiagnosisSystem"
    ADD CONSTRAINT "DiagnosisSystem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DiagnosisSystem DiagnosisSystem_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DiagnosisSystem"
    ADD CONSTRAINT "DiagnosisSystem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Diagnosis Diagnosis_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Diagnosis Diagnosis_diagnosisSystemId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_diagnosisSystemId_fkey" FOREIGN KEY ("diagnosisSystemId") REFERENCES public."DiagnosisSystem"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Diagnosis Diagnosis_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Diagnosis"
    ADD CONSTRAINT "Diagnosis_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Dispensing Dispensing_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Dispensing"
    ADD CONSTRAINT "Dispensing_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Dispensing Dispensing_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Dispensing"
    ADD CONSTRAINT "Dispensing_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public."Prescription"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Dispensing Dispensing_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Dispensing"
    ADD CONSTRAINT "Dispensing_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DoctorDepartment DoctorDepartment_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorDepartment"
    ADD CONSTRAINT "DoctorDepartment_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DoctorDepartment DoctorDepartment_departmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorDepartment"
    ADD CONSTRAINT "DoctorDepartment_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES public."Department"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DoctorDepartment DoctorDepartment_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorDepartment"
    ADD CONSTRAINT "DoctorDepartment_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorSpecialization DoctorSpecialization_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorSpecialization"
    ADD CONSTRAINT "DoctorSpecialization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: DoctorSpecialization DoctorSpecialization_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorSpecialization"
    ADD CONSTRAINT "DoctorSpecialization_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: DoctorSpecialization DoctorSpecialization_specializationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."DoctorSpecialization"
    ADD CONSTRAINT "DoctorSpecialization_specializationId_fkey" FOREIGN KEY ("specializationId") REFERENCES public."Specialization"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Doctor Doctor_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Doctor Doctor_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Doctor"
    ADD CONSTRAINT "Doctor_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Document Document_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmployeeSchedule EmployeeSchedule_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."EmployeeSchedule"
    ADD CONSTRAINT "EmployeeSchedule_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmployeeSchedule EmployeeSchedule_shiftId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."EmployeeSchedule"
    ADD CONSTRAINT "EmployeeSchedule_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES public."Shift"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: EmployeeSchedule EmployeeSchedule_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."EmployeeSchedule"
    ADD CONSTRAINT "EmployeeSchedule_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialYear FinancialYear_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."FinancialYear"
    ADD CONSTRAINT "FinancialYear_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: FinancialYear FinancialYear_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."FinancialYear"
    ADD CONSTRAINT "FinancialYear_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LabOrder LabOrder_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: LabOrder LabOrder_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabOrder LabOrder_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: LabOrder LabOrder_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."LabOrder"
    ADD CONSTRAINT "LabOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MedicineGroup MedicineGroup_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."MedicineGroup"
    ADD CONSTRAINT "MedicineGroup_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: MedicineGroup MedicineGroup_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."MedicineGroup"
    ADD CONSTRAINT "MedicineGroup_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Medicine Medicine_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Medicine Medicine_groupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES public."MedicineGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Medicine Medicine_unitId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES public."Unit"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Medicine Medicine_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Medicine"
    ADD CONSTRAINT "Medicine_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Organisation Organisation_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Organisation"
    ADD CONSTRAINT "Organisation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Organisation Organisation_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Organisation"
    ADD CONSTRAINT "Organisation_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientAllergyRecord PatientAllergyRecord_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergyRecord"
    ADD CONSTRAINT "PatientAllergyRecord_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientAllergyRecord PatientAllergyRecord_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergyRecord"
    ADD CONSTRAINT "PatientAllergyRecord_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: PatientAllergyRecord PatientAllergyRecord_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergyRecord"
    ADD CONSTRAINT "PatientAllergyRecord_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientAllergy PatientAllergy_allergyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergy"
    ADD CONSTRAINT "PatientAllergy_allergyId_fkey" FOREIGN KEY ("allergyId") REFERENCES public."Allergy"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientAllergy PatientAllergy_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergy"
    ADD CONSTRAINT "PatientAllergy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientAllergy PatientAllergy_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergy"
    ADD CONSTRAINT "PatientAllergy_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PatientAllergy PatientAllergy_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientAllergy"
    ADD CONSTRAINT "PatientAllergy_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientVitals PatientVitals_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientVitals"
    ADD CONSTRAINT "PatientVitals_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientVitals PatientVitals_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientVitals"
    ADD CONSTRAINT "PatientVitals_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PatientVitals PatientVitals_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PatientVitals"
    ADD CONSTRAINT "PatientVitals_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Patient Patient_bloodGroupId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_bloodGroupId_fkey" FOREIGN KEY ("bloodGroupId") REFERENCES public."BloodGroup"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Patient Patient_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Patient Patient_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Patient"
    ADD CONSTRAINT "Patient_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Permission Permission_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Permission Permission_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Permission"
    ADD CONSTRAINT "Permission_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrescriptionHistory PrescriptionHistory_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionHistory"
    ADD CONSTRAINT "PrescriptionHistory_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrescriptionHistory PrescriptionHistory_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionHistory"
    ADD CONSTRAINT "PrescriptionHistory_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public."Prescription"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PrescriptionItem PrescriptionItem_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrescriptionItem PrescriptionItem_prescriptionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_prescriptionId_fkey" FOREIGN KEY ("prescriptionId") REFERENCES public."Prescription"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PrescriptionItem PrescriptionItem_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionItem"
    ADD CONSTRAINT "PrescriptionItem_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrescriptionTemplate PrescriptionTemplate_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionTemplate"
    ADD CONSTRAINT "PrescriptionTemplate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrescriptionTemplate PrescriptionTemplate_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionTemplate"
    ADD CONSTRAINT "PrescriptionTemplate_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: PrescriptionTemplate PrescriptionTemplate_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."PrescriptionTemplate"
    ADD CONSTRAINT "PrescriptionTemplate_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Prescription Prescription_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Prescription Prescription_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Prescription Prescription_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Prescription Prescription_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Prescription"
    ADD CONSTRAINT "Prescription_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProcedureOrder ProcedureOrder_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."ProcedureOrder"
    ADD CONSTRAINT "ProcedureOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: ProcedureOrder ProcedureOrder_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."ProcedureOrder"
    ADD CONSTRAINT "ProcedureOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProcedureOrder ProcedureOrder_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."ProcedureOrder"
    ADD CONSTRAINT "ProcedureOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ProcedureOrder ProcedureOrder_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."ProcedureOrder"
    ADD CONSTRAINT "ProcedureOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QueueEntry QueueEntry_appointmentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."QueueEntry"
    ADD CONSTRAINT "QueueEntry_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES public."Appointment"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QueueEntry QueueEntry_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."QueueEntry"
    ADD CONSTRAINT "QueueEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: QueueEntry QueueEntry_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."QueueEntry"
    ADD CONSTRAINT "QueueEntry_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QueueEntry QueueEntry_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."QueueEntry"
    ADD CONSTRAINT "QueueEntry_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: QueueEntry QueueEntry_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."QueueEntry"
    ADD CONSTRAINT "QueueEntry_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RadiologyOrder RadiologyOrder_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RadiologyOrder"
    ADD CONSTRAINT "RadiologyOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RadiologyOrder RadiologyOrder_doctorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RadiologyOrder"
    ADD CONSTRAINT "RadiologyOrder_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES public."Doctor"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RadiologyOrder RadiologyOrder_patientId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RadiologyOrder"
    ADD CONSTRAINT "RadiologyOrder_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES public."Patient"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: RadiologyOrder RadiologyOrder_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RadiologyOrder"
    ADD CONSTRAINT "RadiologyOrder_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RefreshToken RefreshToken_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RefreshToken RefreshToken_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: RefreshToken RefreshToken_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_permissionId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES public."Permission"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RolePermission RolePermission_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RolePermission"
    ADD CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoleSidebarMenu RoleSidebarMenu_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RoleSidebarMenu"
    ADD CONSTRAINT "RoleSidebarMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RoleSidebarMenu RoleSidebarMenu_sidebarMenuId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."RoleSidebarMenu"
    ADD CONSTRAINT "RoleSidebarMenu_sidebarMenuId_fkey" FOREIGN KEY ("sidebarMenuId") REFERENCES public."SidebarMenu"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Role Role_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Shift Shift_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Shift Shift_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Shift"
    ADD CONSTRAINT "Shift_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Specialization Specialization_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Specialization"
    ADD CONSTRAINT "Specialization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Specialization Specialization_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Specialization"
    ADD CONSTRAINT "Specialization_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Unit Unit_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Unit"
    ADD CONSTRAINT "Unit_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Unit Unit_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."Unit"
    ADD CONSTRAINT "Unit_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: User User_roleId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: primesysindia
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: primesysindia
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict ebRDjCmUV0KpaubTOXaXanC2o78V6xvNhffw0A0GXV8kUhPCWG8Mv5ZxGZVmZo5

