// Copyright 2017-2024, University of Colorado Boulder

/**
 * Utilities for creating and manipulating the unique identifiers assigned to instrumented PhET-iO instances, aka
 * phetioIDs.
 *
 * Many of these functions' jsdoc is rendered and visible publicly to PhET-iO client. Those sections should be
 * marked, see top level comment in PhetioClient.js about private vs public documentation
 *
 * @author Chris Malley (PixelZoom, Inc.)
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import affirm from '../../perennial-alias/js/browser-and-node/affirm.js';
import tandemNamespace from './tandemNamespace.js';

/* eslint-disable phet/bad-typescript-text */

const SEPARATOR = '.';
const GROUP_SEPARATOR = '_';
const INTER_TERM_SEPARATOR = '-';
const GENERAL_COMPONENT_NAME = 'general';
const GLOBAL_COMPONENT_NAME = 'global';
const HOME_SCREEN_COMPONENT_NAME = 'homeScreen';
const MODEL_COMPONENT_NAME = 'model';
const VIEW_COMPONENT_NAME = 'view';
const COLORS_COMPONENT_NAME = 'colors';
const STRINGS_COMPONENT_NAME = 'strings';
const CONTROLLER_COMPONENT_NAME = 'controller';
const SCREEN_COMPONENT_NAME = 'Screen';
const ARCHETYPE = 'archetype';
const CAPSULE_SUFFIX = 'Capsule';

/**
 * Helpful static methods for manipulating phetioIDs. Used to minimize the amount of duplicated logic specific to the
 * string structure of the phetioID. Available in the main PhET-iO js import as a global, or statically on PhetioClient.
 * @hideconstructor
 * @class
 */
class PhetioIDUtils {

  private constructor() {
    affirm( false, 'should not construct a PhetioIDUtils' );
  }

  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * Appends a component to an existing phetioID to create a new unique phetioID for the component.
   * @example
   * append( 'myScreen.myControlPanel', 'myComboBox' )
   * -->  'myScreen.myControlPanel.myComboBox'
   * @public
   * @param {string} phetioID - the ID of the PhET-iO Element
   * @param {string|string[]} componentNames - the name or list of names to append to the ID
   * @returns {string} - the appended phetioID
   */
  public static append( phetioID: string, ...componentNames: string[] ): string {
    componentNames.forEach( componentName => {
      affirm( !componentName.includes( SEPARATOR ), `separator appears in componentName: ${componentName}` );
      if ( componentName === '' ) {
        return;
      }
      const separator = phetioID === '' ? '' : SEPARATOR;
      phetioID += separator + componentName;
    } );
    return phetioID;
  }

  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * Given a phetioID for a PhET-iO Element, get the part of that ID that pertains to the component (basically the
   * tail piece).
   * @example
   * getComponentName( 'myScreen.myControlPanel.myComboBox' )
   * -->  'myComboBox'
   * @public
   * @param {string} phetioID - the ID of the PhET-iO Element
   * @returns {string} - the component name
   */
  public static getComponentName( phetioID: string ): string {
    affirm( phetioID.length > 0 );
    const indexOfLastSeparator = phetioID.lastIndexOf( SEPARATOR );
    if ( indexOfLastSeparator === -1 ) {
      return phetioID;
    }
    else {
      return phetioID.substring( indexOfLastSeparator + 1, phetioID.length );
    }
  }

  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * Given a phetioID for a PhET-iO Element, get the phetioID of the parent component.
   * @example
   * getParentID( 'myScreen.myControlPanel.myComboBox' )
   * -->  'myScreen.myControlPanel'
   * @public
   * @param {string} phetioID - the ID of the PhET-iO Element
   * @returns {string|null} - the phetioID of the parent, or null if there is no parent
   */
  public static getParentID( phetioID: string ): string | null {
    const indexOfLastSeparator = phetioID.lastIndexOf( SEPARATOR );
    return indexOfLastSeparator === -1 ? null : phetioID.substring( 0, indexOfLastSeparator );
  }

  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * Given a phetioID for an instrumented object, get a string that can be used to assign an ID to a DOM element
   * @param {string} phetioID - the ID of the PhET-iO Element
   * @returns {string}
   * @public
   * @deprecated
   */
  public static getDOMElementID( phetioID: string ): string {
    return `phetioID:${phetioID}`;
  }

  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * Get the screen id from the phetioID.
   * @example
   * getScreenID( 'sim.myScreen.model.property' )
   * --> sim.myScreen
   * getScreenID( 'sim.myScreen' )
   * --> sim.myScreen
   * getScreenID( 'sim.general.activeProperty' )
   * --> null
   * @param {string} phetioID
   * @public
   * @returns {string|null} - null if there is no screen component name in the phetioID
   */
  public static getScreenID( phetioID: string ): string | null {
    const screenIDParts = [];
    const phetioIDParts = phetioID.split( SEPARATOR );
    for ( let i = 0; i < phetioIDParts.length; i++ ) {
      const componentPart = phetioIDParts[ i ];
      screenIDParts.push( componentPart );
      const indexOfScreenMarker = componentPart.indexOf( SCREEN_COMPONENT_NAME );
      if ( indexOfScreenMarker > 0 && indexOfScreenMarker + SCREEN_COMPONENT_NAME.length === componentPart.length ) { // endsWith proxy
        return screenIDParts.join( SEPARATOR );
      }
    }
    return null;
  }

  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * Get the index number from the component name of the component name provided.
   * @param {string} componentName
   * @returns {number}
   * @example
   * getGroupElementIndex( 'particle_1' )
   * --> 1
   * @public
   */
  public static getGroupElementIndex( componentName: string ): number {
    affirm( componentName.includes( this.GROUP_SEPARATOR ),
      'component name for phetioID should have group element syntax' );
    return Number( componentName.split( this.GROUP_SEPARATOR )[ 1 ] );
  }

  /**
   * Returns true if the potential ancestor is indeed an ancestor of the potential descendant, but not the same phetioID
   * @param {string} potentialAncestorPhetioID
   * @param {string} potentialDescendantPhetioID
   * @returns {boolean}
   * @public
   */
  public static isAncestor( potentialAncestorPhetioID: string, potentialDescendantPhetioID: string ): boolean {
    const ancestorComponents = potentialAncestorPhetioID.split( SEPARATOR );
    const descendantComponents = potentialDescendantPhetioID.split( SEPARATOR );
    for ( let i = 0; i < ancestorComponents.length; i++ ) {
      if ( ancestorComponents[ i ] !== descendantComponents[ i ] ) {
        return false;
      }
    }

    // not the same child
    return potentialDescendantPhetioID !== potentialAncestorPhetioID;
  }

  /**
   * Converts a given phetioID to one where all dynamic element terms (i.e. ones with an underscore, like battery_4)
   * are replaced with the term 'archetype'. This helps when looking up the archetype phetioID or metadata for a given
   * dynamic element. Also support INTER_TERM_SEPARATOR delimited parts, like 'sim.screen1.myObject.term1-and-term2-battery_4-term4-etc'.
   *
   * See unit tests and examples in PhetioIDUtilsTests.ts.
   * @param {string} phetioID
   * @public
   * @returns {string}
   */
  public static getArchetypalPhetioID( phetioID: string ): string {
    const phetioIDParts = phetioID.split( SEPARATOR );

    for ( let i = 0; i < phetioIDParts.length; i++ ) {
      const term = phetioIDParts[ i ];

      if ( term.endsWith( CAPSULE_SUFFIX ) && i < phetioIDParts.length - 1 ) {
        phetioIDParts[ i + 1 ] = ARCHETYPE;
        i++;
      }
      else {
        const mappedInnerTerms = term.split( INTER_TERM_SEPARATOR ).map( term => term.includes( GROUP_SEPARATOR ) ? ARCHETYPE : term );
        phetioIDParts[ i ] = mappedInnerTerms.join( INTER_TERM_SEPARATOR );
      }
    }
    return phetioIDParts.join( SEPARATOR );
  }

  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The separator used to piece together a phet-io ID.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly SEPARATOR = SEPARATOR;


  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The separator used to specify the count of a element in a group.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly GROUP_SEPARATOR = GROUP_SEPARATOR;


  /**
   * The separator used to specify terms in a phetioID that is used by another phetioID. For example:
   *
   * sim.general.view.sim-global-otherID
   *
   * @type {string}
   * @constant
   * @public
   */
  public static readonly INTER_TERM_SEPARATOR = INTER_TERM_SEPARATOR;


  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The component name for the id section that holds phet-io elements general to all simulations.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly GENERAL_COMPONENT_NAME = GENERAL_COMPONENT_NAME;


  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The component name for the id section that holds simulation specific elements that don't belong in a screen.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly GLOBAL_COMPONENT_NAME = GLOBAL_COMPONENT_NAME;


  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The component name for the id section that holds the home screen.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly HOME_SCREEN_COMPONENT_NAME = HOME_SCREEN_COMPONENT_NAME;


  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The component name for an id section that holds model specific elements.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly MODEL_COMPONENT_NAME = MODEL_COMPONENT_NAME;


  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The component name for an id section that holds view specific elements.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly VIEW_COMPONENT_NAME = VIEW_COMPONENT_NAME;


  // Private Doc: The below jsdoc is public to the PhET-iO API documentation. Change wisely.
  /**
   * The component name for an id section that holds controller specific elements.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly CONTROLLER_COMPONENT_NAME = CONTROLLER_COMPONENT_NAME;


  /**
   * The component name for a section that holds colors
   * @type {string}
   * @constant
   * @public
   */
  public static readonly COLORS_COMPONENT_NAME = COLORS_COMPONENT_NAME;


  /**
   * The component name for a section that holds strings
   * @type {string}
   * @constant
   * @public
   */
  public static readonly STRINGS_COMPONENT_NAME = STRINGS_COMPONENT_NAME;


  /**
   * The component name for a dynamic element archetype
   * @type {string}
   * @constant
   * @public
   */
  public static readonly ARCHETYPE = ARCHETYPE;


  /**
   * The component name suffix for the container (parent) of a dynamic element that doesn't have an '_' in it.
   * @type {string}
   * @constant
   * @public
   */
  public static readonly CAPSULE_SUFFIX = CAPSULE_SUFFIX;
}

tandemNamespace.register( 'PhetioIDUtils', PhetioIDUtils );
export default PhetioIDUtils;