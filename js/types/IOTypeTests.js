// Copyright 2021, University of Colorado Boulder

/**
 * Unit tests for IOType
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import merge from '../../../phet-core/js/merge.js';
import PhetioObject from '../PhetioObject.js';
import Tandem from '../Tandem.js';
import IOType from './IOType.js';
import NumberIO from './NumberIO.js';
import StateSchema from './StateSchema.js';

QUnit.module( 'IOType' );

QUnit.test( 'always true', assert => {
  assert.ok( true, 'initial test' );
} );

if ( Tandem.PHET_IO_ENABLED ) {
  QUnit.test( 'fromCoreType', assert => {

    window.assert && assert.throws( () => {
      return new IOType();
    }, 'need args in config' );

    class XHolder extends PhetioObject {
      constructor( x ) {
        super( {
          phetioType: XHolderIO,

          tandem: Tandem.ROOT_TEST.createTandem( 'xHolder' )
        } );
        this.x = x;
      }

      /**
       * @public
       */
      static get STATE_SCHEMA() {
        return {
          x: NumberIO
        };
      }
    }

    const XHolderIO = IOType.fromCoreType( 'XHolderIO', XHolder );

    const xHolder = new XHolder( 4 );
    const stateObject = XHolderIO.toStateObject( xHolder );
    assert.ok( stateObject, 'should be defined' );
    assert.ok( stateObject.x === 4, 'should be right number from stateSchema' );
    XHolderIO.applyState( xHolder, { x: 7 } );
    assert.ok( xHolder.x === 7, 'applyState should be right number' );

    xHolder.dispose();

    ///////////////////////////////////////////////////////////////

    class ParticularParticle extends PhetioObject {
      constructor( options ) {
        options = merge( {
          phetioType: ParticularParticleIO

        }, options );
        super( options );
      }

      /**
       * @public
       */
      static get STATE_SCHEMA() {
        return StateSchema.asValue( 'particularParticle', { isValidValue: value => value === 'particularParticle' } );
      }
    }

    window.assert && assert.throws( () => {
      return IOType.fromCoreType( 'ParticularParticleIO', ParticularParticle );
    }, 'no toStateObject on value StateSchema\'ed IOType.' );

    ParticularParticle.prototype.toStateObject = () => 'particularParticle';

    const ParticularParticleIO = IOType.fromCoreType( 'ParticularParticleIO', ParticularParticle );
    const particularParticle = new ParticularParticle( {
      tandem: Tandem.ROOT_TEST.createTandem( 'particularParticle1' )
    } );

    assert.ok( ParticularParticleIO.toStateObject( particularParticle ) === 'particularParticle', 'serialization should work for value stateSchema' );
    particularParticle.dispose();

  } );
}
