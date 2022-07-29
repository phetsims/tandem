// Copyright 2021-2022, University of Colorado Boulder

/**
 * Unit tests for IOType
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../../phet-core/js/merge.js';
import { combineOptions } from '../../../phet-core/js/optionize.js';
import PhetioObject, { PhetioObjectOptions } from '../PhetioObject.js';
import Tandem from '../Tandem.js';
import IOType from './IOType.js';
import NumberIO, { NumberStateObject } from './NumberIO.js';
import StateSchema from './StateSchema.js';

QUnit.module( 'IOType' );

QUnit.test( 'always true', assert => {
  assert.ok( true, 'initial test' );
} );

if ( Tandem.PHET_IO_ENABLED ) {
  QUnit.test( 'fromCoreType', assert => {

    window.assert && assert.throws( () => {

      // @ts-ignore
      return new IOType();
    }, 'need args in config' );

    class XHolder extends PhetioObject {
      public x: number;

      public constructor( x: number ) {
        super( {
          phetioType: XHolderIO,

          tandem: Tandem.ROOT_TEST.createTandem( 'xHolder' )
        } );
        this.x = x;
      }

      public static get STATE_SCHEMA() {
        return {
          x: NumberIO
        };
      }
    }

    const XHolderIO = IOType.fromCoreType<XHolder, { x: NumberStateObject }>( 'XHolderIO', XHolder );

    const xHolder = new XHolder( 4 );
    const stateObject = XHolderIO.toStateObject( xHolder );
    assert.ok( stateObject, 'should be defined' );
    assert.ok( stateObject.x === 4, 'should be right number from stateSchema' );
    XHolderIO.applyState( xHolder, { x: 7 } );
    assert.ok( xHolder.x === 7, 'applyState should be right number' );

    xHolder.dispose();

    ///////////////////////////////////////////////////////////////

    class ParticularParticle extends PhetioObject {
      public constructor( options: PhetioObjectOptions ) {
        options = combineOptions<PhetioObjectOptions>( {
          phetioType: ParticularParticleIO

        }, options );
        super( options );
      }

      public static get STATE_SCHEMA() {
        return StateSchema.asValue( 'particularParticle', { isValidValue: value => value === 'particularParticle' } );
      }
    }

    window.assert && assert.throws( () => {
      return IOType.fromCoreType( 'ParticularParticleIO', ParticularParticle );
    }, 'no toStateObject on value StateSchema\'ed IOType.' );

    // @ts-ignore we are testing, lets hack!
    ParticularParticle.prototype.toStateObject = () => 'particularParticle';

    const ParticularParticleIO = IOType.fromCoreType( 'ParticularParticleIO', ParticularParticle );
    const particularParticle = new ParticularParticle( {
      tandem: Tandem.ROOT_TEST.createTandem( 'particularParticle1' )
    } );

    assert.ok( ParticularParticleIO.toStateObject( particularParticle ) === 'particularParticle', 'serialization should work for value stateSchema' );
    particularParticle.dispose();

  } );

  QUnit.test( 'fromCoreType with Class hierarchy', assert => {

    class Parent extends PhetioObject {
      public readonly parentNumber: number;

      public constructor( parentNumber: number, options: PhetioObjectOptions ) {
        options = combineOptions<PhetioObjectOptions>( {

          phetioType: ParentIO,

          tandem: Tandem.ROOT_TEST.createTandem( 'parent' )

        }, options );
        super( options );
        this.parentNumber = parentNumber;
      }

      public static get STATE_SCHEMA() {
        return {
          parentNumber: NumberIO
        };
      }
    }

    // @ts-ignore
    class Child extends Parent {
      public readonly childNumber: number;

      public constructor( childNumber: number ) {
        super( 10, {
          phetioType: ChildIO,

          tandem: Tandem.ROOT_TEST.createTandem( 'child' )
        } );

        this.childNumber = childNumber;
      }

      public static override get STATE_SCHEMA() {
        return {
          childNumber: NumberIO
        };
      }
    }

    type ParentState = { parentNumber: NumberStateObject };
    type ChildState = { childNumber: NumberStateObject };
    const ParentIO = IOType.fromCoreType<Parent, ParentState>( 'ParentIO', Parent );
    const ChildIO = IOType.fromCoreType<Child, ChildState & ParentState>(
      'ChildIO', Child, {

        // @ts-ignore
        supertype: ParentIO
      } );

    const child = new Child( 4 );
    const parentStateObject = ParentIO.toStateObject( child );
    assert.ok( parentStateObject.parentNumber === 10, 'simple case, treated as parent' );

    const childStateObject = ChildIO.toStateObject( child );
    assert.ok( childStateObject.childNumber === 4, 'simple case, treated as child' );

    child.dispose();

    ////////////////////////////////////////////////
    // This does not work. Instead, you have to manually create a toStateObject in ChildIO that calls up to the parent.
    // assert.ok( childStateObject.parentNumber === 10, 'oh boy' );
    //
    // Like this example below

    // @ts-ignore
    class ChildThatUsesParentState extends Parent {

      public readonly childNumber: number;

      public constructor( childNumber: number ) {
        super( 10, {
          phetioType: ChildThatUsesParentStateIO,

          tandem: Tandem.ROOT_TEST.createTandem( 'childWithParentState' )
        } );

        this.childNumber = childNumber;
      }

      public toStateObject(): ParentState & ChildState {
        const parentState = ParentIO.toStateObject( this );
        const childSelfState = ChildThatUsesParentStateIO.stateSchema.defaultToStateObject( this );
        return merge( {}, parentState, childSelfState ) as ParentState & ChildState;
      }

      public static override STATE_SCHEMA = {
        childNumber: NumberIO
      };
    }

    const ChildThatUsesParentStateIO = IOType.fromCoreType<ChildThatUsesParentState, ChildState & ParentState>( 'ChildThatUsesParentStateIO', ChildThatUsesParentState, {

      // @ts-ignore
      supertype: ParentIO
    } );

    const childWithParentState = new ChildThatUsesParentState( 555 );
    const newStateObject = ChildThatUsesParentStateIO.toStateObject( childWithParentState );
    assert.ok( newStateObject.parentNumber === 10, 'should include parent' );
    assert.ok( newStateObject.childNumber === 555, 'definitely needs its own number' );
    childWithParentState.dispose();

    ////////////////////////////////////////////////


  } );
}
