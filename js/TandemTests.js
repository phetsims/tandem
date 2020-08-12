// Copyright 2020, University of Colorado Boulder

/**
 * Unit tests for PhetioObject
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import NumberProperty from '../../axon/js/NumberProperty.js';
import Tandem from './Tandem.js';

QUnit.module( 'Tandem' );

QUnit.test( 'Tandem validation on ROOT', assert => {

  let p = new NumberProperty( 0, {
    tandem: Tandem.GENERAL.createTandem( 'aProperty' )
  } );
  assert.ok( p.isPhetioInstrumented(), 'should be instrumented' );

  p = new NumberProperty( 0, {
    tandem: Tandem.GLOBAL.createTandem( 'aProperty' )
  } );
  assert.ok( p.isPhetioInstrumented(), 'should be instrumented' );

  p = new NumberProperty( 0, {
    tandem: Tandem.GENERAL_VIEW.createTandem( 'aProperty' )
  } );
  assert.ok( p.isPhetioInstrumented(), 'should be instrumented' );

  // Only specific tandems allowed on root when validating tandems
  window.assert && Tandem.VALIDATION && assert.throws( () => {
    p = new NumberProperty( 0, {
      tandem: Tandem.GENERAL.createTandem( 'aProperty' )
    } );
  } );
} );