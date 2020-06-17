// Copyright 2020, University of Colorado Boulder

/**
 * phetioAPITest is a general scaffolding for testing component-level PhET-iO API. This test will
 * create a component, and then test that component's metadata against the expected metadata defined by the IOType.api
 * Object. See https://github.com/phetsims/phet-io/issues/1657
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */

import phetioAPIValidation from './phetioAPIValidation.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';
import ObjectIO from './types/ObjectIO.js';

/**
 * @param {Object} assert - from QUnit
 * @param {function(new:ObjectIO)} IOType - must have an `api` defined.
 * @param {string} componentName
 * @param {function():PhetioObject} createPhetioObject
 */
const phetioAPITest = ( assert, IOType, componentName, createPhetioObject ) => {
  if ( Tandem.PHET_IO_ENABLED ) {
    window.assert && window.assert( ObjectIO.isIOType( IOType ), 'IO Type expected' );

    // TODO: remove me when no longer needed, see https://github.com/phetsims/tandem/issues/187
    Tandem.unlaunch();
    Tandem.launch();

    const wasEnabled = phetioAPIValidation.enabled;
    phetioAPIValidation.enabled = false; // This prevents errors when trying to dispose static elements.

    const auxiliaryTandemRegistery = {};

    // TODO: remove this listener once the test is done.
    Tandem.addPhetioObjectListener( {
      addPhetioObject: phetioObject => {
        window.assert && window.assert( !auxiliaryTandemRegistery.hasOwnProperty( phetioObject.tandem.phetioID ),
          `phetioObject registered twice: ${phetioObject.tandem.phetioID}` );
        auxiliaryTandemRegistery[ phetioObject.tandem.phetioID ] = phetioObject;
      },
      removePhetioObject: phetioObject => {
        delete auxiliaryTandemRegistery[ phetioObject.tandem.phetioID ];
      }
    } );

    const phetioObject = createPhetioObject( Tandem.GENERAL.createTandem( componentName ) );

    const validate = ( phetioID, api ) => {
      let metadata = {};
      let phetioObject = null;

      // phetioType is a proxy for an "instrumented PhetioObject", we may change that in the future to be any metadata key
      if ( api.hasOwnProperty( 'phetioType' ) ) {
        phetioObject = auxiliaryTandemRegistery[ phetioID ];
        assert.ok( phetioObject, `no phetioObject for phetioID: ${phetioID}, for phetioType: ${IOType.typeName}` );
        metadata = phetioObject.getMetadata();
        assert.equal( phetioObject.phetioType, api.phetioType, `Expected phetioType differs for for phetioID: ${phetioID}, phetioType: ${IOType.typeName}` );
      }

      for ( const key in api ) {
        if ( metadata.hasOwnProperty( key ) ) {
          assert.equal( metadata[ key ], api[ key ], `metadata key: ${key} doesn't match desired metadata for phetioID: ${phetioID}` );
        }
        else if ( key !== 'phetioType' ) {
          validate( window.phetio.PhetioIDUtils.append( phetioID, key ), api[ key ] );
        }
      }
    };

    assert.ok( auxiliaryTandemRegistery[ phetioObject.tandem.phetioID ] === phetioObject,
      `PhetioObject should be registered: ${phetioObject.tandem.phetioID} for phetioType: ${IOType.typeName}` );
    validate( phetioObject.tandem.phetioID, IOType.api );

    phetioObject.dispose();
    phetioAPIValidation.enabled = wasEnabled;

    // TODO: remove me when no longer needed, see https://github.com/phetsims/tandem/issues/187
    Tandem.unlaunch();
  }
  else {
    assert.ok( true, 'make sure this runs in phet brand' );
  }
};

tandemNamespace.register( 'phetioAPITest', phetioAPITest );
export default phetioAPITest;