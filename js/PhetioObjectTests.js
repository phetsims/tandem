// Copyright 2017-2020, University of Colorado Boulder

/**
 * Unit tests for PhetioObject
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */

import PhetioObject from './PhetioObject.js';
import Tandem from './Tandem.js';
import ObjectIO from './types/ObjectIO.js';

QUnit.module( 'PhetioObject' );

// launch to make sure tandem registration fires listeners
Tandem.launch();

class MockTypeIO extends ObjectIO {}

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
    tandem: Tandem.ROOT,
    phetioType: MockTypeIO,
    phetioState: false
  } );
  obj.phetioStartEvent( 'hello' );
} );

QUnit.test( 'PhetioObject start/end', function( assert ) {
  assert.ok( true, 'initial test' );

  const obj = new PhetioObject( {
    tandem: Tandem.ROOT.createTandem( 'test1' ),
    phetioType: MockTypeIO,
    phetioState: false
  } );
  obj.phetioStartEvent( 'hello' );
  obj.phetioEndEvent();
} );

QUnit.test( 'PhetioObject end without start', function( assert ) {
  assert.ok( true, 'initial test' );

  const obj = new PhetioObject( {
    tandem: Tandem.ROOT.createTandem( 'test2' ),
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
  const test1 = Tandem.ROOT.createTandem( 'test1' );
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

    child2.markDynamicElementArchetype();

    assert.ok( !child2.phetioDynamicElement, 'Not dynamic if archetype: direct child after parent creation' );
    assert.ok( !grandChild2.phetioDynamicElement, 'Not dynamic if archetype: descendant child after parent creation' );
  }

} );

QUnit.test( 'archetype bugginess when Tandem is not launched yet', assert => {

  // reset Tandem launch status to make sure that nothing goes through to phetioEngine in this test until launched again.
  Tandem.unlaunch();

  assert.ok( true, 'initial test' );

  const object1Tandem = Tandem.ROOT.createTandem( 'object1' );
  const phetioObject1 = new PhetioObject( { tandem: object1Tandem } );
  assert.ok( !phetioObject1.phetioIsArchetype, 'should not be an archetype before marking' );
  phetioObject1.markDynamicElementArchetype();
  assert.ok( phetioObject1.phetioIsArchetype, 'should be an archetype after marking' );

  const phetioObject1Child = new PhetioObject( { tandem: object1Tandem.createTandem( 'child' ) } );
  assert.ok( !phetioObject1Child.phetioIsArchetype, 'cannot be an archetype until tandem is launched because nothing is in the map' );

  // launch to make sure tandem registration fires listeners
  Tandem.launch();

  // TODO Failing! because Tandem.launch() doesn't recalculate phetioIsArchetype, see https://github.com/phetsims/tandem/issues/147
  // assert.ok( phetioObject1Child.phetioIsArchetype, 'should be an archetype now that tandem is launched' );
} );