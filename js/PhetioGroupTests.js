// Copyright 2020, University of Colorado Boulder

/**
 * Unit tests for PhetioObject
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import PhetioGroup from './PhetioGroup.js';
import PhetioGroupIO from './PhetioGroupIO.js';
import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';
import ObjectIO from './types/ObjectIO.js';

QUnit.module( 'PhetioGroup' );

QUnit.test( 'PhetioGroup creation and disposal', assert => {

  const createElement = ( tandem, otherField ) => {
    const element = new PhetioObject( {
      tandem: tandem,
      phetioDynamicElement: true
    } );
    element.otherField = otherField;
    return element;
  };
  const phetioGroup = new PhetioGroup( createElement, [ '' ], {
    tandem: Tandem.GENERAL.createTandem( 'phetioGroup' ),
    phetioType: PhetioGroupIO( ObjectIO )
  } );

  phetioGroup.elementCreatedEmitter.addListener( element => {
    assert.ok( phetioGroup.contains( element ), 'element should be in container data structure' );
    assert.ok( phetioGroup.countProperty.value === phetioGroup._array.length, 'element should be in container data structure' );
  } );
  phetioGroup.elementDisposedEmitter.addListener( element => {
    assert.ok( element.isDisposed, 'should be disposed' );
    assert.ok( !phetioGroup.contains( element ), 'should not be in array' );
  } );

  const one = phetioGroup.createNextElement( '' );
  const two = phetioGroup.createNextElement( '' );

  phetioGroup.disposeElement( two );
  phetioGroup.disposeElement( one );

  assert.ok( phetioGroup.countProperty.value === 0, 'no elements left now' );

  phetioGroup.elementCreatedEmitter.addListener( element => {
    if ( element.otherField === 'disposeMe!' ) {
      phetioGroup.disposeElement( element );
    }
  } );
  phetioGroup.createNextElement( '' );
  phetioGroup.createNextElement( '' );
  phetioGroup.createNextElement( '' );
  assert.ok( phetioGroup.countProperty.value === 3, 'added three' );
  phetioGroup.createNextElement( 'disposeMe!' );
  assert.ok( phetioGroup.countProperty.value === 3, 'new element should be immediately disposed' );
} );