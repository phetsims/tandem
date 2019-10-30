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

  // launch to make sure tandem registration fires listeners
  Tandem.launch();

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
      phetioType: MockTypeIO,
      phetioState: false
    } );
    obj.phetioStartEvent( 'hello' );
  } );

  QUnit.test( 'PhetioObject start/end', function( assert ) {
    assert.ok( true, 'initial test' );

    const obj = new PhetioObject( {
      tandem: Tandem.rootTandem.createTandem( 'test1' ),
      phetioType: MockTypeIO,
      phetioState: false
    } );
    obj.phetioStartEvent( 'hello' );
    obj.phetioEndEvent();
  } );

  QUnit.test( 'PhetioObject end without start', function( assert ) {
    assert.ok( true, 'initial test' );

    const obj = new PhetioObject( {
      tandem: Tandem.rootTandem.createTandem( 'test2' ),
      phetioType: MockTypeIO,
      phetioState: false
    } );

    if ( Tandem.PHET_IO_ENABLED ) {
      window.assert && assert.throws( function() {
        obj.phetioEndEvent();
      }, 'Should throw an assertion error when Ending an unstarted event' );
    }
  } );

  QUnit.test( 'PhetioObject.isDynamicElement', assert => {
    const test1 = Tandem.rootTandem.createTandem( 'test1' );
    const parentTandem = test1.createTandem( 'parent' );
    const child1Tandem = parentTandem.createTandem( 'child1' );
    const child2Tandem = parentTandem.createTandem( 'child2' );
    const child1 = new PhetioObject( {
      tandem: child1Tandem
    } );
    const grandChild1 = new PhetioObject( {
      tandem: child1Tandem.createTandem( 'grandChild' )
    } );
    assert.ok( !child1.phetioDynamicElement, 'direct child not dynamic before parent created' );
    assert.ok( !grandChild1.phetioDynamicElement, 'grandchild not dynamic before parent created' );

    const parent = new PhetioObject( {
      tandem: parentTandem,
      phetioDynamicElement: true
    } );
    assert.ok( parent.phetioDynamicElement, 'parent should be dynamic when marked dynamic' );

    // This will only happen in phet-io brand
    if ( Tandem.PHET_IO_ENABLED ) {

      assert.ok( child1.phetioDynamicElement, 'direct child before parent creation' );
      assert.ok( grandChild1.phetioDynamicElement, 'descendant child before parent creation' );

      const child2 = new PhetioObject( {
        tandem: parentTandem.createTandem( 'child2' )
      } );

      const grandChild2 = new PhetioObject( {
        tandem: child2Tandem.createTandem( 'grandChild' )
      } );

      assert.ok( child2.phetioDynamicElement, 'direct child after parent creation' );
      assert.ok( grandChild2.phetioDynamicElement, 'descendant child after parent creation' );

      child2.markDynamicElementPrototype();

      assert.ok( !child2.phetioDynamicElement, 'Not dynamic if prototype: direct child after parent creation' );
      assert.ok( !grandChild2.phetioDynamicElement, 'Not dynamic if prototype: descendant child after parent creation' );
    }

  } );
} );