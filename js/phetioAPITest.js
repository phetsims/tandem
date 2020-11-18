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

import Emitter from '../../axon/js/Emitter.js';
import LinkedElementIO from './LinkedElementIO.js';
import phetioAPIValidation from './phetioAPIValidation.js';
import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';
import tandemNamespace from './tandemNamespace.js';

// constants
const METADATA_KEYS_WITH_PHET_IO_TYPE = PhetioObject.METADATA_KEYS.concat( [ 'phetioType' ] );

/**
 * @param {Object} assert - from QUnit
 * @param {PhetioObjectAPI|UninstrumentedAPI} API
 * @param {string} componentName - name of component that is being tested, largely for error messages
 * @param {function(Tandem,Emitter):PhetioObject} createPhetioObject - second arg is an optional disposeEmitter to add
 *        listeners to for cleanup. The PhetioObject returned by this function will be disposed by phetioAPITest
 */
const phetioAPITest = ( assert, API, componentName, createPhetioObject ) => {
  if ( Tandem.PHET_IO_ENABLED ) {

    const wasEnabled = phetioAPIValidation.enabled;
    phetioAPIValidation.enabled = false; // This prevents errors when trying to dispose static elements.

    const auxiliaryTandemRegistry = {};

    // TODO: remove this listener once the test is done. https://github.com/phetsims/phet-io/issues/1657
    Tandem.addPhetioObjectListener( {
      addPhetioObject: phetioObject => {
        window.assert && window.assert( !auxiliaryTandemRegistry.hasOwnProperty( phetioObject.tandem.phetioID ),
          `phetioObject registered twice: ${phetioObject.tandem.phetioID}` );
        auxiliaryTandemRegistry[ phetioObject.tandem.phetioID ] = phetioObject;
      },
      removePhetioObject: phetioObject => {
        delete auxiliaryTandemRegistry[ phetioObject.tandem.phetioID ];
      }
    } );

    const disposeEmitter = new Emitter();
    const expectedComponentTandem = Tandem.GENERAL.createTandem( componentName );
    const expectedComponentPhetioObject = createPhetioObject( expectedComponentTandem, disposeEmitter );

    const visit = ( phetioID, componentAPI ) => {
      window.assert && window.assert( typeof phetioID === 'string' );

      let phetioObject = auxiliaryTandemRegistry[ phetioID ];

      // Some APIs are of type UninstrumentedAPI, marked as such because they don't have an entry in the tandem registry
      if ( componentAPI.uninstrumented ) {
        assert.ok( !auxiliaryTandemRegistry.hasOwnProperty( phetioID ),
          `Uninstrumented API spec should not have an instrumented instance in the registry: ${phetioID}` );
      }
      else {
        assert.ok( auxiliaryTandemRegistry[ phetioID ] === phetioObject,
          `Registered PhetioObject should be the same: ${phetioID} for phetioType: ${componentName}` );
      }

      for ( const key in componentAPI ) {
        if ( componentAPI.hasOwnProperty( key ) ) {
          if ( METADATA_KEYS_WITH_PHET_IO_TYPE.includes( key ) ) {

            // Existence of any metadata key indicates the object must be instrumented (and not just an empty
            // intermediate phetioID)
            assert.ok( phetioObject, `missing phetioObject for phetioID: ${phetioID}, for component test: ${componentName}` );

            // forward the LinkedElementIO onto the element that is linked to, since it should be validated as if it
            // was the linked element.
            if ( phetioObject.phetioType === LinkedElementIO ) {
              phetioObject = phetioObject.element;
            }

            if ( key === 'phetioType' ) {

              const actualIOType = phetioObject.phetioType;
              const expectedIOType = componentAPI.phetioType;

              // Check for exact type match but also allow subtypes: ChildClass.prototype instanceof ParentClass
              // https://stackoverflow.com/questions/14486110/how-to-check-if-a-javascript-class-inherits-another-without-creating-an-obj
              assert.ok( actualIOType === expectedIOType || actualIOType.prototype instanceof expectedIOType, 'phetioType must be subtype' );
              if ( expectedIOType.parameterTypes || actualIOType.parameterTypes ) {
                assert.equal( expectedIOType.parameterTypes, actualIOType.parameterTypes, 'Parameter types should match exactly' );
              }
            }
            else {

              // Presence of a metadataKey indicates it is an instrumented instance
              assert.equal( phetioObject[ key ], componentAPI[ key ], `metadata mismatch for ${phetioID}:${key}` );
            }
          }
          else {

            // Descend to the next level of the componentAPI fragment
            visit( window.phetio.PhetioIDUtils.append( phetioID, key ), componentAPI[ key ] );
          }
        }
      }
    };

    visit( expectedComponentTandem.phetioID, API );

    expectedComponentPhetioObject.dispose();
    disposeEmitter.emit();
    phetioAPIValidation.enabled = wasEnabled;
  }
  else {
    assert.ok( true, 'make sure this runs in phet brand' );
  }
};

tandemNamespace.register( 'phetioAPITest', phetioAPITest );
export default phetioAPITest;