import React, { useState, useCallback } from 'react';
import { LoadScript, Autocomplete } from '@react-google-maps/api';
import './LocationPicker.css';

const LocationPicker = ({ onLocationSelect, apiKey }) => {
  // State for autocomplete instance
  const [autocomplete, setAutocomplete] = useState(null);
  
  // Loading states
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [searchLoaded, setSearchLoaded] = useState(false);
  
  // Error state
  const [error, setError] = useState(null);

  // Handle autocomplete load
  const onLoad = useCallback((autocompleteInstance) => {
    try {
      setAutocomplete(autocompleteInstance);
      setSearchLoaded(true);
    } catch (err) {
      setError('Failed to load location search');
      console.error('Autocomplete load error:', err);
    }
  }, []);

  // Handle place selection
  const onPlaceChanged = useCallback(() => {
    try {
      if (!autocomplete) {
        setError('Location service not ready');
        return;
      }

      const place = autocomplete.getPlace();
      
      if (!place?.geometry?.location) {
        setError('Please select a valid location from the suggestions');
        return;
      }
      
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        address: place.formatted_address,
        placeId: place.place_id
      };
      
      onLocationSelect(location);
      setError(null);
    } catch (err) {
      setError('Failed to process location');
      console.error('Place changed error:', err);
    }
  }, [autocomplete, onLocationSelect]);

  // Handle script load success
  const onScriptLoad = useCallback(() => {
    setScriptLoaded(true);
    setError(null);
  }, []);

  // Handle script load error
  const onScriptError = useCallback(() => {
    setError('Failed to load Google Maps service');
    setScriptLoaded(false);
  }, []);

  return (
    <div className="location-picker-container">
      {/* Google Maps Script Loader */}
      <LoadScript
        googleMapsApiKey={apiKey}
        libraries={['places']}
        onLoad={onScriptLoad}
        onError={onScriptError}
        loadingElement={<div className="loading-message">Loading maps service...</div>}
      >
        {/* Main Search Input */}
        {scriptLoaded ? (
          <div className="search-container">
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
              fields={['geometry.location', 'formatted_address', 'place_id']}
              types={['establishment', 'geocode']}
            >
              <input
                type="text"
                placeholder="Enter event location"
                className="location-search-input"
                disabled={!scriptLoaded}
                aria-label="Event location search"
              />
            </Autocomplete>
            
            {/* Loading indicator for search */}
            {!searchLoaded && scriptLoaded && (
              <div className="loading-indicator">Loading search...</div>
            )}
          </div>
        ) : (
          <div className="loading-message">Initializing location service...</div>
        )}
      </LoadScript>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span role="alert">{error}</span>
        </div>
      )}

      {/* Help Text */}
      <div className="help-text">
        Start typing to search for venues or addresses
      </div>
    </div>
  );
};

export default LocationPicker;