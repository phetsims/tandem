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

// constants
const METADATA_KEYS_WITH_PHET_IO_TYPE = PhetioObject.METADATA_KEYS.concat( [ 'phetioType' ] );

/**
 * @param {Object} assert - from QUnit
 * @param {ObjectAPI} API - must have an `api` defined.
 * @param {string} componentName - name of component that is being tested, largely for error messages
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

    const visit = ( phetioID, componentAPI ) => {
      window.assert && window.assert( typeof phetioID === 'string' );

      for ( const key in componentAPI ) {
        if ( componentAPI.hasOwnProperty( key ) ) {
          if ( METADATA_KEYS_WITH_PHET_IO_TYPE.includes( key ) ) {

            // Existence of any metadata key indicates the object must be instrumented (and not just an empty
            // intermediate phetioID)
            const phetioObject = auxiliaryTandemRegistry[ phetioID ];
            assert.ok( phetioObject, `missing phetioObject for phetioID: ${phetioID}, for component test: ${componentName}` );

            if ( key === 'phetioType' ) {

              // Check for exact type match but also allow subtypes: ChildClass.prototype instanceof ParentClass
              // https://stackoverflow.com/questions/14486110/how-to-check-if-a-javascript-class-inherits-another-without-creating-an-obj
              const actualIOType = phetioObject.phetioType;
              const expectedIOType = componentAPI.phetioType;
              assert.ok( actualIOType === expectedIOType || actualIOType.prototype instanceof expectedIOType, 'phetioType must be subtype' );
              if ( expectedIOType.parameterTypes || actualIOType.parameterTypes ) {
                assert.ok( expectedIOType.parameterTypes === actualIOType.parameterTypes, 'Parameter types should match exactly' );
              }
            }
            else {

              // Presence of a metadataKey indicates it is an instrumented instance
              assert.equal( phetioObject[ key ], componentAPI[ key ], 'mismatch for ' + phetioID + ':' + key );
            }
          }
          else {

            // Descend to the next level of the componentAPI fragment
            visit( window.phetio.PhetioIDUtils.append( phetioID, key ), componentAPI[ key ] );
          }
        }
      }
    };

    // Some APIs are of type UninstrumentedAPI, marked as such because they don't have an entry in the tandem registry
    if ( !API.uninstrumented && auxiliaryTandemRegistry[ phetioObject.tandem.phetioID ] ) {
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