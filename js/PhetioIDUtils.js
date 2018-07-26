// Copyright 2017, University of Colorado Boulder

/**
 * Utilities for creating and manipulating the unique identifiers assigned to instrumented PhET-iO instances, aka
 * phetioIDs.
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 */
( function() {
  'use strict';

  // define the phet global
  window.phetio = window.phetio || {};

  // constants
  var SEPARATOR = '.';

  /**
   * Helpful methods for manipulating phetioIDs. Used to minimize the amount of duplicated logic specific to the string
   * structure of the phetioID. Available in the main PhET-iO js import.
   * @namespace
   */
  window.phetio.PhetioIDUtils = {

    /**
     * Appends a component to an existing phetioID to create a new unique phetioID for the component.
     * Example: append( 'myScreen.myControlPanel', 'myComboBox' ) -> 'myScreen.myControlPanel.myComboBox'
     * @public
     * @param {string} phetioID
     * @param {string} componentName
     * @returns {string}
     */
    append: function( phetioID, componentName ) {
      assert && assert( componentName.indexOf( SEPARATOR ) === -1, 'separator appears in componentName: ' + componentName );
      return phetioID + SEPARATOR + componentName;
    },

    /**
     * Given a phetioID for a component (instance), get the part of that id that pertains to the component.
     * Example: 'myScreen.myControlPanel.myComboBox' -> 'myComboBox'
     * @public
     * @param {string} phetioID
     * @returns {string}
     */
    getComponentName: function( phetioID ) {
      // TODO: Use PhetioIDUtils for this.
      assert && assert( phetioID.length > 0 );
      var indexOfLastSeparator = phetioID.lastIndexOf( SEPARATOR );
      if ( indexOfLastSeparator === -1 ) {
        return phetioID;
      }
      else {
        return phetioID.substring( indexOfLastSeparator + 1, phetioID.length );
      }
    },

    /**
     * Given a phetioID for a component, get the phetioID of the parent component.
     * Example: 'myScreen.myControlPanel.myComboBox' -> 'myScreen.myControlPanel'
     * @public
     * @param {string} phetioID
     * @returns {string}
     */
    getParentID: function( phetioID ) {
      var indexOfLastSeparator = phetioID.lastIndexOf( SEPARATOR );
      assert && assert( indexOfLastSeparator !== -1, 'phetioID does not have a parent component: ' + phetioID );
      return phetioID.substring( 0, indexOfLastSeparator );
    },

    /**
     * The separator used to piece together a phet-io id.
     * @type {String}
     * @constant
     * @public
     */
    SEPARATOR: SEPARATOR
  };
} )();