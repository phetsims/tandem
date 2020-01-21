// Copyright 2019, University of Colorado Boulder

/**
 * A PhET-iO class that encapsulates a PhetioObject that is not created during sim startup to provide PhET-iO API
 * validation, API communication (like to view in studio before creation), and to support PhET-iO state if applicable.
 *
 * Constructing a PhetioCapsule creates a container encapsulating a wrapped instance that can be of any type.
 *
 * Clients should use myCapsule.getInstance() instead of storing the instance value itself.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const Emitter = require( 'AXON/Emitter' );
  const merge = require( 'PHET_CORE/merge' );
  const PhetioDynamicElementContainer = require( 'TANDEM/PhetioDynamicElementContainer' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  // strings
  const capsuleString = 'Capsule';

  class PhetioCapsule extends PhetioDynamicElementContainer {

    /**
     * @param {function(tandem, ...):PhetioObject} createInstance - function that creates the encapsulated instance
     * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments - arguments passed to createInstance during API baseline generation
     * @param {Object} [options]
     */
    constructor( createInstance, defaultArguments, options ) {

      options = merge( {
        tandem: Tandem.REQUIRED
      }, options );

      assert && assert( !!options.phetioType, 'phetioType must be supplied' );
      assert && assert( !!options.phetioType.parameterTypes, 'PhetioCapsuleIO must supply its parameter types' );
      assert && assert( options.phetioType.parameterTypes.length === 1, 'PhetioCapsuleIO must have exactly one parameter type' );
      assert && assert( !!options.phetioType.parameterTypes[ 0 ], 'PhetioCapsuleIO parameterType must be truthy' );
      assert && assert( options.tandem.name.endsWith( capsuleString ), 'PhetioCapsule tandems should end with Capsule suffix' );

      // options that depend on other options
      options = merge( {

        // {string} - the PhetioCapsule tandem name without the "Capsule" suffix
        phetioDynamicElementName: options.tandem.name.slice( 0, options.tandem.name.length - capsuleString.length )
      }, options );

      super( createInstance, defaultArguments, options );

      // @private
      this.createInstance = createInstance;

      // @private
      this.instanceCreatedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );
      this.instanceDisposedEmitter = new Emitter( { parameters: [ { isValidValue: _.stubTrue } ] } );

      // @public (read-only)
      this.instance = null;

      // @private {string}
      this.instanceTandemName = options.phetioDynamicElementName;

      // Emit to the data stream on instance creation/disposal
      this.addInstanceCreatedListener( instance => this.createdEventListener( instance ) );
      this.addInstanceDisposedListener( instance => this.disposedEventListener( instance ) );
    }

    /**
     * @param {function} listener
     * @public
     */
    addInstanceCreatedListener( listener ) {
      this.instanceCreatedEmitter.addListener( listener );
    }

    /**
     * @param {function} listener
     * @public
     */
    removeInstanceCreatedListener( listener ) {
      this.instanceCreatedEmitter.removeListener( listener );
    }

    /**
     * @param {function} listener
     * @public
     */
    addInstanceDisposedListener( listener ) {
      this.instanceDisposedEmitter.addListener( listener );
    }

    /**
     * @param {function} listener
     * @public
     */
    removeInstanceDisposedListener( listener ) {
      this.instanceDisposedEmitter.removeListener( listener );
    }

    /**
     * Dispose the underlying instance.  Called by the PhetioStateEngine so the capsule instance can be recreated with the
     * correct state.
     * @public (phet-io)
     */
    disposeInstance() {
      this.instanceDisposedEmitter.emit( this.instance );
      this.instance.dispose();
      this.instance = null;
    }

    /**
     * Creates the instance if it has not been created yet, and returns it.
     * @param {Array.<*>} [argsForCreateFunction]
     * @returns {Object}
     * @public
     */
    getInstance( ...argsForCreateFunction ) {
      if ( !this.instance ) {
        this.create( ...argsForCreateFunction );
      }
      return this.instance;
    }

    /**
     * Primarily for internal use, clients should usually use getInstance.
     * @param {Array.<*>} [argsForCreateFunction]
     * @returns {Object}
     * @public (phet-io)
     */
    create( ...argsForCreateFunction ) {

      // create with default state and substructure, details will need to be set by setter methods.
      this.instance = this.createDynamicElement(
        this.instanceTandemName,
        this.createInstance,
        argsForCreateFunction,
        this.phetioType.parameterTypes[ 0 ]
      );

      this.instanceCreatedEmitter.emit( this.instance );

      return this.instance;
    }
  }

  return tandemNamespace.register( 'PhetioCapsule', PhetioCapsule );
} );