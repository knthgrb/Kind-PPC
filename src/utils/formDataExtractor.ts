/**
 * Utility functions to help extract and parse form data
 */

export interface FormDataExtractor {
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean;
  getArray(key: string): string[];
  getDate(key: string): string | undefined;
  getNestedArray<T>(baseKey: string, fields: string[]): T[];
  getAvailabilitySchedule(): { [key: string]: { available: boolean; hours?: [string, string] } };
  getWorkExperience(): Array<{
    employer: string;
    duration: string;
    description: string;
    start_date?: string;
    end_date?: string;
    job_type: string;
    skills_used: string[];
  }>;
}

export class FormDataExtractorImpl implements FormDataExtractor {
  constructor(private formData: FormData) {}

  getString(key: string): string | undefined {
    const value = this.formData.get(key);
    return value ? String(value).trim() : undefined;
  }

  getNumber(key: string): number | undefined {
    const value = this.formData.get(key);
    if (!value) return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  }

  getBoolean(key: string): boolean {
    const value = this.formData.get(key);
    return value === 'true' || value === '1' || value === 'on';
  }

  getArray(key: string): string[] {
    const values = this.formData.getAll(key);
    return values.map(v => String(v)).filter(v => v.trim());
  }

  getDate(key: string): string | undefined {
    const value = this.formData.get(key);
    if (!value) return undefined;
    
    try {
      const date = new Date(String(value));
      return isNaN(date.getTime()) ? undefined : date.toISOString().split('T')[0];
    } catch {
      return undefined;
    }
  }

  /**
   * Extract nested form data for arrays (e.g., work_experience[0][employer])
   */
  getNestedArray<T>(baseKey: string, fields: string[]): T[] {
    const result: T[] = [];
    let index = 0;
    
    while (true) {
      const entry: Record<string, string> = {};
      let hasData = false;
      
      for (const field of fields) {
        const key = `${baseKey}[${index}][${field}]`;
        const value = this.formData.get(key);
        
        if (value !== null) {
          entry[field] = String(value).trim();
          hasData = true;
        }
      }
      
      if (!hasData) break;
      
      result.push(entry as T);
      index++;
    }
    
    return result;
  }

  /**
   * Extract availability schedule from form data
   */
  getAvailabilitySchedule(): { [key: string]: { available: boolean; hours?: [string, string] } } {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const schedule: { [key: string]: { available: boolean; hours?: [string, string] } } = {};
    
    days.forEach(day => {
      const isAvailable = this.getBoolean(`${day}_available`);
      schedule[day] = { available: isAvailable };
      
      if (isAvailable) {
        const startTime = this.getString(`${day}_start`);
        const endTime = this.getString(`${day}_end`);
        if (startTime && endTime) {
          schedule[day].hours = [startTime, endTime];
        }
      }
    });
    
    return schedule;
  }

  /**
   * Extract work experience entries from form data
   */
  getWorkExperience(): Array<{
    employer: string;
    duration: string;
    description: string;
    start_date?: string;
    end_date?: string;
    job_type: string;
    skills_used: string[];
  }> {
    const entries: Array<{
      employer: string;
      duration: string;
      description: string;
      start_date?: string;
      end_date?: string;
      job_type: string;
      skills_used: string[];
    }> = [];
    
    let index = 0;
    
    while (true) {
      const employer = this.getString(`work_experience[${index}][employer]`);
      const duration = this.getString(`work_experience[${index}][duration]`);
      const description = this.getString(`work_experience[${index}][description]`);
      const jobType = this.getString(`work_experience[${index}][job_type]`);
      
      // Stop if required fields are missing
      if (!employer || !duration || !description || !jobType) {
        break;
      }
      
      const entry = {
        employer,
        duration,
        description,
        start_date: this.getDate(`work_experience[${index}][start_date]`),
        end_date: this.getDate(`work_experience[${index}][end_date]`),
        job_type: jobType,
        skills_used: this.getArray(`work_experience[${index}][skills_used]`),
      };
      
      entries.push(entry);
      index++;
    }
    
    return entries;
  }
}

/**
 * Create a form data extractor instance
 */
export function createFormDataExtractor(formData: FormData): FormDataExtractor {
  return new FormDataExtractorImpl(formData);
}
