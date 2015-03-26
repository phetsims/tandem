//  Copyright 2002-2014, University of Colorado Boulder

/**
 *
 * ComponentIDContext can be used to specify componentID for together.js when components are reused
 * and need different componentID values.  Note that contexts are *conceptual* only and should be used
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
  function ComponentIDContext( pathElement ) {

    // @private
    this.text = pathElement || '';
  }

  return inherit( Object, ComponentIDContext, {

    /**
     * Create a new ComponentIDContext by appending the given pathElement
     * @param {string} pathElement
     * @returns {ComponentIDContext}
     */
    createContext: function( pathElement ) {
      if ( this.text.length > 0 ) {
        return new ComponentIDContext( this.text + '.' + pathElement );
      }
      else {
        return new ComponentIDContext( pathElement );
      }
    },

    /**
     * Creates a componentID string by appending a pathElement string to this context
     * @param {string} pathElement
     * @returns {string}
     */
    createComponentID: function( pathElement ) {
      return this.createContext( pathElement ).componentID;
    },

    /**
     * Gets the entire path for this context
     * @returns {string}
     */
    get componentID() {
      return this.text;
    }
  } );
} );