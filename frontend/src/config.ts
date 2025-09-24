const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';
// Allow overriding uploads base URL separately, but default to API uploads path
const UPLOADS_BASE_URL = process.env.REACT_APP_UPLOADS_BASE_URL || `${API_BASE_URL}/uploads`;

export { API_BASE_URL, UPLOADS_BASE_URL };
