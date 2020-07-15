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
import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';

/**
 * @param {Object} assert - from QUnit
 * @param {ObjectAPI} API - must have an `api` defined.
 * @param {string} componentName
 * @param {function():PhetioObject} createPhetioObject
 */
const phetioAPITest = ( assert, API, componentName, createPhetioObject ) => {
  if ( Tandem.PHET_IO_ENABLED ) {
    // window.assert && window.assert( ObjectIO.isIOType( IOType ), 'IO Type expected' );

    // TODO: remove me when no longer needed, see https://github.com/phetsims/tandem/issues/187
    Tandem.unlaunch();
    Tandem.launch();

    const wasEnabled = phetioAPIValidation.enabled;
    phetioAPIValidation.enabled = false; // This prevents errors when trying to dispose static elements.

    const auxiliaryTandemRegistry = {};

    const phetioIDs = [];

    // TODO: remove this listener once the test is done.
    Tandem.addPhetioObjectListener( {
      addPhetioObject: phetioObject => {
        window.assert && window.assert( !auxiliaryTandemRegistry.hasOwnProperty( phetioObject.tandem.phetioID ),
          `phetioObject registered twice: ${phetioObject.tandem.phetioID}` );
        auxiliaryTandemRegistry[ phetioObject.tandem.phetioID ] = phetioObject;
        phetioIDs.push( phetioObject.tandem.phetioID );
      },
      removePhetioObject: phetioObject => {
        delete auxiliaryTandemRegistry[ phetioObject.tandem.phetioID ];
      }
    } );

    const expectedComponentTandem = Tandem.GENERAL.createTandem( componentName );
    const phetioObject = createPhetioObject( expectedComponentTandem );

    const visit = ( phetioID, api ) => {

      window.assert && window.assert( typeof phetioID === 'string' );
      window.assert && window.assert( api instanceof Object, 'Object expected for api' );

      let metadata = {};
      let phetioObject = null;

      // phetioType is a proxy for an "instrumented PhetioObject", we may change that in the future to be any metadata key
      // TODO: what if SliderIO/SliderAPI is instrumented, but doesn't provide phetioType? https://github.com/phetsims/phet-io/issues/1657
      if ( api.options && api.options.hasOwnProperty( 'phetioType' ) ) {

        phetioObject = auxiliaryTandemRegistry[ phetioID ];
        assert.ok( phetioObject, `no phetioObject for phetioID: ${phetioID}, for phetioType: ${componentName}` );
        assert.ok( phetioObject.tandem.phetioID === phetioID,
          `PhetioObject should be registered with the expected phetioID:  ${expectedComponentTandem.phetioID}` );
        metadata = phetioObject.getMetadata();
        assert.equal( phetioObject.phetioType, api.options.phetioType, `Expected phetioType differs for for phetioID: ${phetioID}, phetioType: ${componentName}` );
      }
      else {

        // Synthetic elements don't have phetioObjects, but should have children, so make sure that at least one was created.
        assert.ok( phetioIDs.filter( anyPhetioID => anyPhetioID.startsWith( phetioID ) ).length > 0, `synthetic phetioID expected ${phetioID}` );
      }

      for ( const key in api.options ) {

        if ( PhetioObject.METADATA_KEYS.includes( key ) ) {
          assert.equal( metadata[ key ], api[ key ], `metadata key: ${key} doesn't match desired metadata for phetioID: ${phetioID}` );
        }
      }

      for ( const subKey in api ) {
        if ( subKey !== 'options' ) {
          visit( window.phetio.PhetioIDUtils.append( phetioID, subKey ), api[ subKey ] );
        }
      }
    };

    if ( auxiliaryTandemRegistry[ phetioObject.tandem.phetioID ] ) {
      assert.ok( auxiliaryTandemRegistry[ phetioObject.tandem.phetioID ] === phetioObject,
        `Registered PhetioObject should be the same: ${phetioObject.tandem.phetioID} for phetioType: ${componentName}` );
    }
    visit( expectedComponentTandem.phetioID, API );

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