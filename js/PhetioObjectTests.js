// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests for PhetioObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var PhetioObject = require( 'TANDEM/PhetioObject' );
  var Tandem = require( 'TANDEM/Tandem' );

  QUnit.module( 'PhetioObject' );

  QUnit.test( 'PhetioObject start/start', function( assert ) {
    assert.ok( true, 'initial test' );

    var obj = new PhetioObject( { tandem: Tandem.rootTandem } );
    obj.startEvent( 'model', 'hello' );
    window.assert && assert.throws( function() {
      obj.startEvent( 'model', 'hello' );
    }, 'Should throw an assertion error when starting event twice' );
  } );

  QUnit.test( 'PhetioObject start/end', function( assert ) {
    assert.ok( true, 'initial test' );

    var obj = new PhetioObject( { tandem: Tandem.rootTandem } );
    var id = obj.startEvent( 'model', 'hello' );
    obj.endEvent( id );
    assert.ok( id === undefined, 'id should be undefined' );
  } );

  QUnit.test( 'PhetioObject end without start', function( assert ) {
    assert.ok( true, 'initial test' );

    var obj = new PhetioObject( { tandem: Tandem.rootTandem } );
    window.assert && assert.throws( function() {
      obj.endEvent( 'model', 'hello' );
    }, 'Should throw an assertion error when Ending an unstarted event' );
  } );
} );