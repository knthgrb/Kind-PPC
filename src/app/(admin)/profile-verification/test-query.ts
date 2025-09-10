// Test file to debug the query issue
import { createClient } from "@/utils/supabase/server";

export async function testUserQuery() {
  const supabase = await createClient();
  
  console.log("=== TESTING USER QUERY ===");
  
  // First, let's test a simple query to get all users
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role')
    .limit(10);
    
  console.log("All users query result:", { 
    count: allUsers?.length || 0, 
    error: allUsersError,
    users: allUsers?.map(u => ({ id: u.id, email: u.email, role: u.role }))
  });
  
  // Show unique roles
  const uniqueRoles = [...new Set(allUsers?.map(u => u.role) || [])];
  console.log("Unique roles found:", uniqueRoles);
  
  // Now test with role filter
  const { data: filteredUsers, error: filteredError } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, role')
    .in('role', ['kindtao', 'kindbossing'])
    .limit(5);
    
  console.log("Filtered users query result:", { 
    count: filteredUsers?.length || 0, 
    error: filteredError,
    users: filteredUsers 
  });
  
  // Test the full query with documents
  const { data: usersWithDocs, error: docsError } = await supabase
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      phone,
      profile_image_url,
      role,
      created_at,
      user_documents!left (
        id,
        user_id,
        document_type,
        file_name,
        file_path,
        verification_status
      )
    `)
    .in('role', ['kindtao', 'kindbossing'])
    .limit(5);
    
  console.log("Users with documents query result:", { 
    count: usersWithDocs?.length || 0, 
    error: docsError,
    users: usersWithDocs 
  });
  
  return { allUsers, filteredUsers, usersWithDocs };
}
