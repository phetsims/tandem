// Copyright 2017, University of Colorado Boulder

/**
 * Unit tests for IOObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var IOObject = require( 'TANDEM/IOObject' );
  var Tandem = require( 'TANDEM/Tandem' );

  QUnit.module( 'IOObject' );

  QUnit.test( 'IOObject start/start', function( assert ) {
    assert.ok( true, 'initial test' );

    var obj = new IOObject( { tandem: Tandem.rootTandem } );
    obj.startEvent( 'model', 'hello' );
    window.assert && assert.throws( function() {
      obj.startEvent( 'model', 'hello' );
    }, 'Should throw an assertion error when starting event twice' );
  } );

  QUnit.test( 'IOObject start/end', function( assert ) {
    assert.ok( true, 'initial test' );

    var obj = new IOObject( { tandem: Tandem.rootTandem } );
    var id = obj.startEvent( 'model', 'hello' );
    obj.endEvent( id );
    assert.ok( typeof id === 'number' || typeof id === 'boolean', 'id should be numeric|boolean' );
  } );

  QUnit.test( 'IOObject end without start', function( assert ) {
    assert.ok( true, 'initial test' );

    var obj = new IOObject( { tandem: Tandem.rootTandem } );
    window.assert && assert.throws( function() {
      obj.endEvent( 'model', 'hello' );
    }, 'Should throw an assertion error when Ending an unstarted event' );
  } );
} );