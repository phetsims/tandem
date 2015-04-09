// Copyright 2002-2014, University of Colorado Boulder

/**
 *
 * TogetherContext can be used to specify togetherID for together.js when components are reused
 * and need different togetherID values.  Note that contexts are *conceptual* only and should be used
 * to design a straightforward API for researchers and 3rd parties.  Contexts are not meant to match up
 * exactly with implementation.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );

  /**
   * @param {string} [pathElement] - optional initial context as a string
   * @constructor
   */
  function TogetherContext( pathElement ) {

    // @private
    this.text = pathElement || '';
  }

  return inherit( Object, TogetherContext, {

    /**
     * Create a new TogetherContext by appending the given pathElement
     * @param {string} pathElement
     * @returns {TogetherContext}
     */
    createContext: function( pathElement ) {
      if ( this.text.length > 0 ) {
        return new TogetherContext( this.text + '.' + pathElement );
      }
      else {
        return new TogetherContext( pathElement );
      }
    },

    /**
     * Creates a togetherID string by appending a pathElement string to this context
     * @param {string} pathElement
     * @returns {string}
     */
    createTogetherID: function( pathElement ) {
      return this.createContext( pathElement ).togetherID;
    },

    /**
     * Gets the entire path for this context
     * @returns {string}
     */
    get togetherID() {
      return this.text;
    }
  } );
} );