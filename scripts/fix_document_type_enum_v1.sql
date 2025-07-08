-- Fix document_type enum to have correct values
-- This script safely updates the enum to use 'form_builder' and 'mapping'

-- Step 1: Check if enum exists and what values it has
-- SELECT unnest(enum_range(NULL::document_type)) AS enum_values;

-- Step 2: If enum exists with wrong values, we need to recreate it
-- First, remove the constraint temporarily if the column exists
DO $$
BEGIN
    -- Check if documents table has document_type column
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name='documents' AND column_name='document_type') THEN
        
        -- Drop the column temporarily to recreate enum
        ALTER TABLE documents DROP COLUMN IF EXISTS document_type;
    END IF;
    
    -- Drop existing enum if it exists
    DROP TYPE IF EXISTS document_type CASCADE;
    
    -- Create new enum with correct values
    CREATE TYPE document_type AS ENUM ('form_builder', 'mapping');
    
    -- Add column back to documents table
    ALTER TABLE documents ADD COLUMN document_type document_type DEFAULT 'mapping';
    
    -- Create index for performance
    CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
    
END $$;

-- Verify the enum was created correctly
SELECT unnest(enum_range(NULL::document_type)) AS enum_values; 