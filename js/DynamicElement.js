// Copyright 2019, University of Colorado Boulder

/**
 * For PhET-iO, we must be able to validate the API in order to ensure we don't make breaking changes in future versions.
 * DynamicElement wraps a function that knows how to create a dynamic, or optional, PhetioObject.  When generating the
 * baseline file, or when we want to validate a simulation against the baseline file, the PhetioObject is eagerly created
 * so we can harvest its API.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 * @author Chris Klusendorf (PhET Interactive Simulations)
 * @deprecated
 */
define( require => {
  'use strict';

  // modules
  const PhetioGroup = require( 'TANDEM/PhetioGroup' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );

  class DynamicElement {

    /**
     * @param {function} creator takes arguments and returns a PhetioObject with phetioDynamicElement: true
     * @param {Object[]} [defaultArguments]
     */
    constructor( creator, ...defaultArguments ) {
      this.instance = null;
      this.creator = creator;

      if ( phet.phetio && phet.phetio.queryParameters.phetioPrintPhetioFiles ) {
        this.getInstance( ...defaultArguments );

        // {boolean} - hack alert! when printing the baseline, we need to keep track of dynamic element prototypes so
        // they appear in the baseline
        this.instance.markDynamicElementPrototype();
      }
    }

    /**
     * Returns the instance associated with this DynamicElement, creating it if necesasry.
     * @param {Object[]} [arguments] passed through to the function
     * @returns {PhetioObject}
     * @public
     */
    getInstance() {
      this.instance && assert( arguments.length === 0, '' );
      this.instance = this.instance || this.creator.apply( null, arguments );
      assert && Tandem.PHET_IO_ENABLED && PhetioGroup.assertDynamicPhetioObject( this.instance );
      return this.instance;
    }
  }

  return tandemNamespace.register( 'DynamicElement', DynamicElement );
} );