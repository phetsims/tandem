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
  const DynamicTandem = require( 'TANDEM/DynamicTandem' );
  const merge = require( 'PHET_CORE/merge' );
  const phetioAPIValidation = require( 'TANDEM/phetioAPIValidation' );
  const PhetioGroup = require( 'TANDEM/PhetioGroup' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );

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
        phetioState: false
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

      // @private {PhetioObject}
      this.instancePrototype = null;

      // When generating the baseline, output the schema for the prototype
      if ( ( phet.phetio && phet.phetio.queryParameters.phetioPrintPhetioFiles ) || phetioAPIValidation.enabled ) {

        const args = Array.isArray( defaultArguments ) ? defaultArguments : defaultArguments();
        assert && assert( createInstance.length === args.length + 1, 'mismatched number of arguments' );

        this.instancePrototype = createInstance( this.tandem.createTandem( 'prototype' ), ...args );

        // So that the prototype get's included in the baseline schema
        this.instancePrototype.markDynamicElementPrototype();
      }
    }

    /**
     * remove and dispose all registered group members
     * @public
     */
    disposeInstance() {
      this.instance.dispose();
    }

    /**
     * CreatPrimarily for internal use, clients should usually use createNextMember.
     * @param {Array.<*>} [argsForCreateFunction]
     * @returns {Object}
     * @public (PhetioCapsuleIO)
     */
    create( ...argsForCreateFunction ) {
      assert && assert( Array.isArray( argsForCreateFunction ), 'should be array' );

      // TODO: underscore hackary to declare this as a dynamic tandem.
      const instanceTandem = new DynamicTandem( this.tandem, '_' + this.instanceTandemName, this.tandem.getExtendedOptions() );

      // create with default state and substructure, details will need to be set by setter methods.
      this.instance = this.createInstance( instanceTandem, ...argsForCreateFunction );

      // Make sure the new group member matches the schema for members.
      validate( this.instance, this.phetioType.parameterType.validator );

      assert && PhetioGroup.assertDynamicPhetioObject( this.instance );

      return this.instance;
    }
  }

  return tandemNamespace.register( 'PhetioCapsule', PhetioCapsule );
} );