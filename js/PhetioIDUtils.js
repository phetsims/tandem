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
  var GROUP_SEPARATOR_TOKEN = '_';

  /**
   * Helpful methods for manipulating phetioIDs. Used to minimize the amount of duplicated logic specific to the string
   * structure of the phetioID. Available in the main PhET-iO js import.
   * @namespace
   */
  window.phetio.PhetioIDUtils = {

    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * Appends a component to an existing phetioID to create a new unique phetioID for the component.
     * @example
     * append( 'myScreen.myControlPanel', 'myComboBox' )
     * -->  'myScreen.myControlPanel.myComboBox'
     * @public
     * @param {string} phetioID
     * @param {string} componentName
     * @returns {string}
     */
    append: function( phetioID, componentName ) {
      assert && assert( componentName.indexOf( SEPARATOR ) === -1, 'separator appears in componentName: ' + componentName );
      return phetioID + SEPARATOR + componentName;
    },

    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * Given a phetioID for a component (instance), get the part of that id that pertains to the component.
     * @example
     * getComponentName( 'myScreen.myControlPanel.myComboBox' )
     * -->  'myComboBox'
     * @public
     * @param {string} phetioID
     * @returns {string}
     */
    getComponentName: function( phetioID ) {
      assert && assert( phetioID.length > 0 );
      var indexOfLastSeparator = phetioID.lastIndexOf( SEPARATOR );
      if ( indexOfLastSeparator === -1 ) {
        return phetioID;
      }
      else {
        return phetioID.substring( indexOfLastSeparator + 1, phetioID.length );
      }
    },

    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * Given a phetioID for a component, get the phetioID of the parent component.
     * @example
     * getParentID( 'myScreen.myControlPanel.myComboBox' )
     * -->  'myScreen.myControlPanel'
     * @public
     * @param {string} phetioID
     * @returns {string}
     */
    getParentID: function( phetioID ) {
      var indexOfLastSeparator = phetioID.lastIndexOf( SEPARATOR );
      assert && assert( indexOfLastSeparator !== -1, 'phetioID does not have a parent component: ' + phetioID );
      return phetioID.substring( 0, indexOfLastSeparator );
    },

    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * Given a phetioID for a instrumented object, get a string that can be used to assign an ID to a DOM element
     * @param {string} phetioID
     * @returns {string}
     * @public
     */
    getDOMElementID: function( phetioID ) {
      return 'phetioID:' + phetioID;
    },

    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * The root sim id has a nested "general" id which contains several simulation-level components.  This
     * method can be used for convenience in accessing its children.
     * @param {Client} Client - the Client type, not a Client instance
     * @param {string} componentName
     * @returns {string}
     * @public
     */
    getGeneralID: function( Client, componentName ) {
      var general = phetio.PhetioIDUtils.append( Client.CAMEL_CASE_SIMULATION_NAME, 'general' );
      return phetio.PhetioIDUtils.append( general, componentName );
    },

    // TODO: Should this be reimplemented to compare to concrete phetioID? github.com/phetsims/phet-io/issues/1442
    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely. See Tandem.getConcretePhetioID().
    /**
     * If the PhET-iO element was created dynamically, after the sim was constructed.
     * @param {string} phetioID
     * @returns {boolean}
     * @public
     */
    isDynamicElement: function( phetioID ) {
      return phetioID.indexOf( GROUP_SEPARATOR_TOKEN ) >= 0;
    },

    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * The separator used to piece together a phet-io id.
     * @type {String}
     * @constant
     * @public
     */
    SEPARATOR: SEPARATOR,

    // Private doc: The below jsdoc is public to the phet-io api documentation. Change wisely.
    /**
     * The separator used to specify the count of a member in a group.
     * @type {String}
     * @constant
     * @public
     */
    GROUP_SEPARATOR_TOKEN: GROUP_SEPARATOR_TOKEN
  };
} )();