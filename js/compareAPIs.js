// Copyright 2020, University of Colorado Boulder

/**
 * Function to compare an api against a reference API.
 * TODO: documentation, https://github.com/phetsims/phet-io/issues/1648
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import tandemNamespace from './tandemNamespace.js';

const BREAKING_API_KEYS = [
  'phetioDynamicElement',
  'phetioEventType',
  'phetioIsArchetype',
  'phetioPlayback',
  'phetioReadOnly',
  'phetioState',
  'phetioTypeName'
];

/**
 *
 * @param {Object.<phetioID:string, phetioObjectMetadata:Object>} referenceAPI
 * @param {Object.<phetioID:string, phetioObjectMetadata:Object>} api
 * @returns {string[]} - list of reported errors
 */
const compareAPIs = ( referenceAPI, api ) => {

  const report = [];
  for ( const phetioID in referenceAPI ) {
    if ( referenceAPI.hasOwnProperty( phetioID ) ) {

      if ( !api.hasOwnProperty( phetioID ) ) {
        report.push( 'missing phetioID: ' + phetioID );
      }
      else {
        for ( let i = 0; i < BREAKING_API_KEYS.length; i++ ) {
          const key = BREAKING_API_KEYS[ i ];
          if ( referenceAPI[ phetioID ][ key ] !== api[ phetioID ][ key ] ) {
            report.push( `invalid metadata for ${phetioID}, key=${key}, expected ${referenceAPI[ phetioID ][ key ]} but received ${api[ phetioID ][ key ]}` );
          }
        }
      }
    }
  }

  // TODO: compare types too, https://github.com/phetsims/phet-io/issues/1648
  // TODO: Factor out keysToCheck so it can be reused in different tests.

  return report;
};

tandemNamespace.register( 'compareAPI', compareAPIs );
export default compareAPIs;