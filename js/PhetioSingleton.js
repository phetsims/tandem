// Copyright 2019, University of Colorado Boulder

/**
 * A PhET-iO class that encapsulates a PhetioObject that is not created during sim startup to provide PhET-iO API
 * validation, API communication (like to view in studio before creation), and to support PhET-iO state if applicable.
 *
 * Constructing a PhetioSingleton effectively creates the singleton where the wrapped instance can be of any type.
 *
 * Clients should use mySingleton.getInstance() instead of storing the instance value itself.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const merge = require( 'PHET_CORE/merge' );
  const PhetioDynamicUtil = require( 'TANDEM/PhetioDynamicUtil' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  class PhetioSingleton extends PhetioObject {

    /**
     * @param {function(tandem, ...):PhetioObject} createInstance - function that creates a group member
     * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments - arguments passed to createInstance during API baseline generation
     * @param {Object} [options] - describe the Singleton itself
     */
    constructor( createInstance, defaultArguments, options ) {

      assert && assert( typeof createInstance === 'function', 'createInstance should be a function' );
      assert && assert( Array.isArray( defaultArguments ) || typeof defaultArguments === 'function', 'defaultArguments should be an array or a function' );
      if ( Array.isArray( defaultArguments ) ) {
        assert && assert( createInstance.length === defaultArguments.length + 1, 'mismatched number of arguments' ); // createInstance also takes tandem
      }

      options = merge( {
        phetioState: false,
        tandem: Tandem.required
      }, options );

      assert && assert( !!options.phetioType, 'phetioType must be supplied' );
      assert && assert( !!options.phetioType.parameterTypes, 'PhetioSingletonIO must supply its parameter types' );
      assert && assert( options.phetioType.parameterTypes.length === 1, 'PhetioSingletonIO must have exactly one parameter type' );
      assert && assert( !!options.phetioType.parameterTypes[ 0 ], 'PhetioSingletonIO parameterType must be truthy' );
      assert && assert( options.tandem.name.endsWith( 'Singleton' ), 'PhetioSingleton tandems should end with Singleton suffix' );

      super( options );

      // @private
      this.createInstance = createInstance;

      // @public (read-only)
      this.instance = null;

      // @public (read-only) {PhetioObject|null} Can be used as an argument to create other prototypes
      this.instancePrototype = PhetioDynamicUtil.createPrototype( this.tandem, createInstance, defaultArguments );
    }

    /**
     * Dispose the underlying instance.  Called by the PhetioStateEngine so the singleton can be recreated with the
     * correct state.
     * @public (phet-io)
     */
    disposeInstance() {
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
      this.instance = PhetioDynamicUtil.createDynamicPhetioObject(
        this.tandem,
        'instance',
        this.createInstance,
        argsForCreateFunction,
        this.phetioType.parameterTypes[ 0 ].validator
      );

      return this.instance;
    }
  }

  return tandemNamespace.register( 'PhetioSingleton', PhetioSingleton );
} );