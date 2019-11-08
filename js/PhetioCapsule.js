// Copyright 2019, University of Colorado Boulder

/**
 * A PhET-iO class that encapsulates a PhetioObject that is not created during sim startup to provide PhET-iO API
 * validation, API communication (like to view in studio before creation), and to support PhET-iO state if applicable
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

  class PhetioCapsule extends PhetioObject {

    /**
     * @param {string} instanceTandemName - name of the instance
     * @param {function(tandem, ...):PhetioObject} createInstance - function that creates a group member
     * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments arguments passed to create during API harvest
     * @param {Object} [options] - describe the Capsule itself
     */
    constructor( instanceTandemName, createInstance, defaultArguments, options ) {

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
      assert && assert( !!options.phetioType.parameterType, 'PhetioCapsule is parametric, and needs a phetioType with a parameterType.' );

      super( options );

      // @private
      this.createInstance = createInstance;

      // @public (read-only)
      this.instance = null;

      // @private
      this.instanceTandemName = instanceTandemName;

      // @public (read-only) {PhetioObject|null} Can be used as an argument to create other prototypes
      this.instancePrototype = PhetioDynamicUtil.createPrototype( this.tandem, createInstance, defaultArguments );
    }

    /**
     * remove and dispose all registered group members
     * @public
     */
    disposeInstance() {
      this.instance.dispose();
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
     * CreatPrimarily for internal use, clients should usually use createNextMember.
     * @param {Array.<*>} [argsForCreateFunction]
     * @returns {Object}
     * @public
     */
    create( ...argsForCreateFunction ) {

      // TODO: underscore hackary to declare this as a dynamic tandem.
      // create with default state and substructure, details will need to be set by setter methods.
      this.instance = PhetioDynamicUtil.createDynamicPhetioObject( this.tandem, '_' + this.instanceTandemName,
        this.createInstance, argsForCreateFunction, this.phetioType.parameterType.validator );

      return this.instance;
    }
  }

  return tandemNamespace.register( 'PhetioCapsule', PhetioCapsule );
} );