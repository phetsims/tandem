// Copyright 2017-2019, University of Colorado Boulder

/**
 * Unit tests for PhetioObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const ObjectIO = require( 'TANDEM/types/ObjectIO' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );

  // ifphetio
  require( 'ifphetio!PHET_IO/phetioEngine' );

  QUnit.module( 'PhetioObject' );

  const MockTypeIO = function( instance, phetioID ) {};
  MockTypeIO.typeName = 'MockTypeIO';
  MockTypeIO.events = [ 'hello' ];
  MockTypeIO.documentation = 'mock type';
  MockTypeIO.methods = {};
  MockTypeIO.supertype = null;
  MockTypeIO.allEvents = [ 'hello' ];
  MockTypeIO.validator = { isValidValue: () => true };
  ObjectIO.validateSubtype( MockTypeIO );

  QUnit.test( 'PhetioObject start/start', function( assert ) {
    assert.ok( true, 'initial test' );

    const obj = new PhetioObject( {
      tandem: Tandem.rootTandem,
      phetioType: MockTypeIO
    } );
    obj.phetioStartEvent( 'hello' );
  } );

  QUnit.test( 'PhetioObject start/end', function( assert ) {
    assert.ok( true, 'initial test' );

    const obj = new PhetioObject( {
      tandem: Tandem.rootTandem.createTandem( 'test1' ),
      phetioType: MockTypeIO
    } );
    obj.phetioStartEvent( 'hello' );
    obj.phetioEndEvent();
  } );

  QUnit.test( 'PhetioObject end without start', function( assert ) {
    assert.ok( true, 'initial test' );

    const obj = new PhetioObject( {
      tandem: Tandem.rootTandem.createTandem( 'test2' ),
      phetioType: MockTypeIO
    } );

    if ( Tandem.PHET_IO_ENABLED ) {
      window.assert && assert.throws( function() {
        obj.phetioEndEvent();
      }, 'Should throw an assertion error when Ending an unstarted event' );
    }
  } );
} );