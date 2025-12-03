import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Generate() {
  const navigate = useNavigate();
  
  useEffect(() => {
    // Redirect to home with state to open GenerateSheet
    navigate('/', { state: { openGenerate: true } });
  }, [navigate]);

  return null;
}
