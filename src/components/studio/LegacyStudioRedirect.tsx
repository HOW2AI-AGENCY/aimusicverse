/**
 * LegacyStudioRedirect - Redirects old /studio/:trackId to unified /studio-v2/track/:trackId
 */

import { Navigate, useParams } from 'react-router-dom';

export function LegacyStudioRedirect() {
  const { trackId } = useParams<{ trackId: string }>();
  
  if (!trackId) {
    return <Navigate to="/studio-v2" replace />;
  }
  
  return <Navigate to={`/studio-v2/track/${trackId}`} replace />;
}
