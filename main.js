/*
    Team : Enterprise Backend Solutions
    Role : Team Representative
    Name : Jeo D. Latorre
    Date : June 13, 2025

    Task       : User Profile Manager
    Technology : Node.js, HTTP, File System
    Description: A simple Node.js HTTP server that manages user profiles with CRUD operations.
    Features
        [1] User authentication
        [2] Create, read, update, and delete user profiles
        [3] Data persistence with JSON file storage
*/

//-------- Import required modules 
const http = require('http');
const url = require('url');
const fs = require('fs');

//-------- Constants and configurations
const PORT = 3000;

const filePath = __dirname + '/users.json';
const AUTH_TOKEN = 'my-secret-token';

// Try and catch to check if users.json exists, create if not
let localFile;
try {
    localFile = fs.readFileSync(filePath, 'utf8');                              // Read the file synchronously, utilizing utf8 encoding for human-readable format
    console.log('File loaded successfully');                                    // Log success message
} catch (error) {
    console.log('users.json not found, creating new file...');                  // Log error message if file not found

    const defaultData = JSON.stringify([], null, 2);                            // Create default data as an empty array with pretty formatting

    fs.writeFileSync(filePath, defaultData, 'utf8');                            // Write the default data to users.json file  
    localFile = defaultData;                                                    // Assign default data to localFile variable   
    console.log('Created new users.json file');                                 // Log success message for file creation
}

const users = JSON.parse(localFile);                                            // Parse the JSON data from the file into a JavaScript object

// Save data to local file
function saveUsers() {
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2), 'utf8');         // Write the users array back to the file in a pretty format
}

// Authenticate Request 
function isAuthenticated(req) {
    const token = req.headers.authorization;                                    // Get the Authorization header from the request
    return token === `Bearer ${AUTH_TOKEN}`;                                    // Check if the token matches the expected value    
}

// Helper function to get request body
function getRequestBody(req) {
    return new Promise((resolve) => {
        let body = '';                                                          // Initialize an empty string to accumulate the request body data   
        req.on('data', chunk => {
            body += chunk.toString();                                           // Convert the chunk to a string and append it to the body 
        });
        req.on('end', () => {
            try {
                resolve(JSON.parse(body));                                      // Parse the accumulated body string as JSON and resolve the promise with the result
            } catch {
                resolve({});                                                    // If parsing fails, resolve with an empty object   
            }
        });
    });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
    const parsedUrl = url.parse(req.url, true);                                         // Parse the request URL and query parameters
    const method = req.method;                                                          // Get the request method
    const pathname = parsedUrl.pathname;                                                // Get the request pathname
    const query = parsedUrl.query;                                                      // Get the request query parameters

    // Set response headers
    res.setHeader('Content-Type', 'application/json');                                  // Set the Content-Type header to application/json
    res.setHeader('Access-Control-Allow-Origin', '*');                                  // Allow all origins for CORS
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');            // Allow specific HTTP methods for CORS
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');       // Allow specific headers for CORS 

    // Handle preflight requests for CORS
    if (method === 'OPTIONS') {
        res.writeHead(200);                                                             // Respond with 200 OK for preflight requests
        res.end();                                                                      // End the response
        return;                                                                         // Exit the function early for OPTIONS requests
    }

    // Check authentication (bonus feature)
    if (!isAuthenticated(req)) {
        res.writeHead(401);                                                             // Respond with 401 Unauthorized for unauthenticated requests
        res.end(JSON.stringify({ error: 'Unauthorized. Use Bearer token.' }));          // Send error message in JSON format
        return;                                                                         // Exit the function early for unauthenticated requests
    }

    // Route handling
    if (pathname === '/users') {
        
        // GET /users?id=1 or GET /users (all users)
        if (method === 'GET') {
            // If an ID is provided in the query, return that user
            if (query.id) {
                const user = users.find(u => u.id == query.id);                         // Find the user by ID in the users array
                
                // If user is found, return it; otherwise, return 404
                if (user) {
                    res.writeHead(200);                                                 // Respond with 200 OK
                    res.end(JSON.stringify(user));                                      // Send the user data in JSON format
                } else {
                    res.writeHead(404);                                                 // Respond with 404 Not Found
                    res.end(JSON.stringify({ error: 'User not found' }));               // Send error message in JSON format
                }

            // If no ID is provided, return all users
            } else {
                res.writeHead(200);                                                     // Respond with 200 OK
                res.end(JSON.stringify(users));                                         // Send the entire users array in JSON format
            }
        }

        // POST /users
        else if (method === 'POST') {
            const body = await getRequestBody(req);                                     // Get the request body as JSON
            
            // Validate required fields
            if (!body.name || !body.email) {
                res.writeHead(400);                                                     // Respond with 400 Bad Request
                res.end(JSON.stringify({ error: 'Name and email are required' }));      // Send error message in JSON format
                return;                                                                 // Exit the function early for invalid requests
            }

            // Check if user with the same email already exists
            const newUser = {
                id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,       // Generate a new ID based on existing users
                name: body.name,                                                        // Set the name from the request body
                email: body.email,                                                      // Set the email from the request body  
                role: body.role || 'viewer'                                             // Set the role from the request body or default to 'viewer'    
            };

            users.push(newUser);                                                        // Add the new user to the users array
            saveUsers();                                                                // Save the updated users array to the file

            res.writeHead(201);                                                         // Respond with 201 Created
            res.end(JSON.stringify(newUser));                                           // Respond with 201 Created and send the new user data in JSON format
        }

        // PUT /users?id=1
        else if (method === 'PUT') {
            // Check if user ID is provided in the query
            if (!query.id) {
                res.writeHead(400);                                                     // Respond with 400 Bad Request       
                res.end(JSON.stringify({ error: 'User ID is required' }));              // Send error message in JSON format
                return;                                                                 // Exit the function early for invalid requests
            }

            const userIndex = users.findIndex(u => u.id == query.id);                   // Find the index of the user by ID in the users array

            // If user not found, return 404
            if (userIndex === -1) {
                res.writeHead(404);                                                     // Respond with 404 Not Found
                res.end(JSON.stringify({ error: 'User not found' }));                   // Send error message in JSON format
                return;                                                                 // Exit the function early for user not found   
            }

            const body = await getRequestBody(req);                                     // Get the request body as JSON
            
            // Update user fields
            if (body.name) users[userIndex].name = body.name;                           // Update name if provided in the request body    
            if (body.email) users[userIndex].email = body.email;                        // Update email if provided in the request body
            if (body.role) users[userIndex].role = body.role;                           // Update role if provided in the request body

            saveUsers();                                                                // Save the updated users array to the file

            res.writeHead(200);                                                         // Respond with 200 OK
            res.end(JSON.stringify(users[userIndex]));                                  // Respond with the updated user data in JSON format
        }

        // DELETE /users?id=1
        else if (method === 'DELETE') {
            // Check if user ID is provided in the query
            if (!query.id) {
                res.writeHead(400);                                                     // Respond with 400 Bad Request
                res.end(JSON.stringify({ error: 'User ID is required' }));              // Send error message in JSON format
                return;                                                                 // Exit the function early for invalid requests
            }

            const userIndex = users.findIndex(u => u.id == query.id);                   // Find the index of the user by ID in the users array
            if (userIndex === -1) {
                res.writeHead(404);                                                     // Respond with 404 Not Found
                res.end(JSON.stringify({ error: 'User not found' }));                   // Send error message in JSON format
                return;                                                                 // Exit the function early for user not found
            }

            const deletedUser = users.splice(userIndex, 1)[0];                          // Remove the user from the users array and get the deleted user data
            saveUsers();                                                                // Save the updated users array to the file

            res.writeHead(200);                                                         // Respond with 200 OK
            res.end(JSON.stringify({ message: 'User deleted', user: deletedUser }));    // Respond with the deleted user data in JSON format
        }

        // If method is not GET, POST, PUT, or DELETE, respond with 405 Method Not Allowed
        else {  
            res.writeHead(405);                                                         // Respond with 405 Method Not Allowed
            res.end(JSON.stringify({ error: 'Method not allowed' }));                   // Send error message in JSON format
        }
    }
    
    // If the route is not recognized, respond with 404 Not Found
    else {
        res.writeHead(404);                                                             // Respond with 404 Not Found
        res.end(JSON.stringify({ error: 'Route not found' }));                          // Send error message in JSON format    
    }
});

// Handle uncaught exceptions
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);                          // Log the server URL
    console.log('Use Authorization header: Bearer my-secret-token');                    // Log the required authorization token for requests
    console.log('Available endpoints:');                                                // Log available endpoints
    console.log('- GET /users (all users)');                                            // Log endpoint to get all users
    console.log('- GET /users?id=1 (specific user)');                                   // Log endpoint to get a specific user by ID   
    console.log('- POST /users (create user)');                                         // Log endpoint to create a new user
    console.log('- PUT /users?id=1 (update user)');                                     // Log endpoint to update a user by ID
    console.log('- DELETE /users?id=1 (delete user)');                                  // Log endpoint to delete a user by ID
});
