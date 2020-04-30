// Copyright 2020, University of Colorado Boulder

/**
 * Unit tests for PhetioObject
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import Property from '../../axon/js/Property.js';
import Tandem from './Tandem.js';

QUnit.module( 'Tandem', {
  before() {

    // launch to make sure tandem registration fires listeners
    Tandem.launch();
  },
  after() {
    Tandem.unlaunch();
  }
} );

QUnit.test( 'Tandem validation on ROOT', assert => {

  let p = new Property( 0, {
    tandem: Tandem.GENERAL.createTandem( 'property' )
  } );
  assert.ok( p.isPhetioInstrumented(), 'should be instrumented' );

  p = new Property( 0, {
    tandem: Tandem.GLOBAL.createTandem( 'property' )
  } );
  assert.ok( p.isPhetioInstrumented(), 'should be instrumented' );

  p = new Property( 0, {
    tandem: Tandem.GENERAL_VIEW.createTandem( 'property' )
  } );
  assert.ok( p.isPhetioInstrumented(), 'should be instrumented' );

  // Only specific tandems allowed on root when validating tandems
  window.assert && Tandem.errorOnFailedValidation() && assert.throws( () => {
    p = new Property( 0, {
      tandem: Tandem.GENERAL.createTandem( 'property' )
    } );
  } );
} );