// Helper function to calculate distance between two points
export const calculateDistance = (point1, point2) => {
  const [lat1, lon1] = point1
  const [lat2, lon2] = point2
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Helper function to find the closest point on the planned route to current GPS position
export const findClosestRouteSegment = (currentPosition, plannedRoute) => {
  if (!currentPosition || !plannedRoute || plannedRoute.length < 2) return -1
  
  let minDistance = Infinity
  let closestSegmentIndex = -1
  
  for (let i = 0; i < plannedRoute.length - 1; i++) {
    const segmentStart = plannedRoute[i]
    const segmentEnd = plannedRoute[i + 1]
    
    // Calculate distance from current position to this segment
    const distToStart = calculateDistance(currentPosition, segmentStart)
    const distToEnd = calculateDistance(currentPosition, segmentEnd)
    
    // Use the closest point on the segment
    const minDistToSegment = Math.min(distToStart, distToEnd)
    
    if (minDistToSegment < minDistance) {
      minDistance = minDistToSegment
      closestSegmentIndex = i
    }
  }
  
  return closestSegmentIndex
}

// Helper function to split route into completed and remaining segments
export const splitRouteByProgress = (plannedRoute, currentPosition) => {
  if (!plannedRoute || plannedRoute.length < 2 || !currentPosition) {
    return { completed: [], remaining: plannedRoute || [] }
  }

  const closestSegmentIndex = findClosestRouteSegment(currentPosition, plannedRoute)
  
  if (closestSegmentIndex === -1) {
    return { completed: [], remaining: plannedRoute }
  }

  // Create completed route: from start to current position
  const completed = plannedRoute.slice(0, closestSegmentIndex + 1)
  completed.push(currentPosition) // Add current position as end of completed route
  
  // Create remaining route: from current position to end
  const remaining = [currentPosition, ...plannedRoute.slice(closestSegmentIndex + 1)]
  
  return { completed, remaining }
}

// Helper function to find coordinates for a timestamp in route data
export const findCoordinatesForTimestamp = (timestamp, routeData) => {
  if (!routeData || routeData.length === 0) return null
  
  // Find the exact match or closest timestamp
  const exactMatch = routeData.find(record => record.timestamp === timestamp)
  if (exactMatch && exactMatch.latitude && exactMatch.longitude) {
    return [parseFloat(exactMatch.latitude), parseFloat(exactMatch.longitude)]
  }
  
  // If no exact match, find the closest timestamp
  const sortedData = [...routeData].sort((a, b) => 
    Math.abs(new Date(a.timestamp) - new Date(timestamp)) - 
    Math.abs(new Date(b.timestamp) - new Date(timestamp))
  )
  
  const closest = sortedData[0]
  if (closest && closest.latitude && closest.longitude) {
    return [parseFloat(closest.latitude), parseFloat(closest.longitude)]
  }
  
  return null
}
