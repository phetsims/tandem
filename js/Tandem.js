// Copyright 2015-2020, University of Colorado Boulder

/**
 * Tandem defines a set of trees that are used to assign unique identifiers to PhetioObjects in PhET simulations and
 * notify listeners when the associated PhetioObjects have been added/removed. It is used to support PhET-iO.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */

import arrayRemove from '../../phet-core/js/arrayRemove.js';
import deprecationWarning from '../../phet-core/js/deprecationWarning.js';
import merge from '../../phet-core/js/merge.js';
import tandemNamespace from './tandemNamespace.js';

// text
const packageString = JSON.stringify( ( window.phet && phet.chipper && phet.chipper.packageObject ) ? phet.chipper.packageObject : { name: 'placeholder' } );

// constants
const packageJSON = JSON.parse( packageString ); // Tandem can't depend on joist, so cannot use packageJSON module
const PHET_IO_ENABLED = _.hasIn( window, 'phet.phetio' );
const PRINT_MISSING_TANDEMS = PHET_IO_ENABLED && phet.phetio.queryParameters.phetioPrintMissingTandems;
const VALIDATE_TANDEMS = PHET_IO_ENABLED && phet.phetio.queryParameters.phetioValidateTandems;

// used to keep track of missing tandems.  Each element has type {{phetioID:{string}, stack:{string}}
const missingTandems = {
  required: [],
  optional: []
};

// Listeners that will be notified when items are registered/deregistered. See doc in addPhetioObjectListener
const phetioObjectListeners = [];

// variables
// Before listeners are wired up, tandems are buffered.  When listeners are wired up, Tandem.launch() is called and
// buffered tandems are flushed, then subsequent tandems are delivered to listeners directly
let launched = false;

// {PhetioObject[]} - PhetioObjects that have been added before listeners are ready.
const bufferedPhetioObjects = [];

class Tandem {

  /**
   * Typically, sims will create tandems using `tandem.createTandem`.  This constructor is used internally or when
   * a tandem must be created from scratch.
   *
   * @param {Tandem|null} parentTandem - parent for a child tandem, or null for a root tandem
   * @param {string} name - component name for this level, like 'resetAllButton'
   * @param {Object} [options]
   */
  constructor( parentTandem, name, options ) {
    assert && assert( parentTandem === null || parentTandem instanceof Tandem, 'parentTandem should be null or Tandem' );
    assert && assert( typeof name === 'string', 'name must be defined' );
    assert && assert( this.getTermRegex().test( name ), `name should match the regex pattern: ${name}` );

    // @public (read-only) {Tandem|null}
    this.parentTandem = parentTandem;

    // @public (read-only) - the last part of the tandem (after the last .), used e.g., in Joist for creating button
    // names dynamically based on screen names
    this.name = name;

    // @public (read-only)
    this.phetioID = this.parentTandem ? phetio.PhetioIDUtils.append( this.parentTandem.phetioID, this.name )
                                      : this.name;

    // options (even subtype options) must be stored so they can be passed through to children
    // Note: Make sure that added options here are also added to options for inheritance and/or for composition
    // (createTandem/parentTandem/getExtendedOptions) as appropriate.
    options = merge( {

      // required === false means it is an optional tandem
      required: true,

      // if the tandem is required but not supplied, an error will be thrown.
      supplied: true
    }, options );

    // @private
    this.required = options.required;

    // @public (read-only)
    this.supplied = options.supplied;
  }

  /**
   * Returns the regular expression which can be used to test each term. The term must consist only of alpha-numeric
   * characters or tildes.
   * @returns {RegExp}
   * @protected
   */
  getTermRegex() {
    return /^[a-zA-Z0-9~[\],]+$/; // TODO: eliminate ~ once GroupTandem has been deleted, see https://github.com/phetsims/tandem/issues/87
  }

  /**
   * Adds a PhetioObject.  For example, it could be an axon Property, SCENERY/Node or SUN/RoundPushButton.
   * phetioEngine listens for when PhetioObjects are added and removed to keep track of them for PhET-iO.
   * @param {PhetioObject} phetioObject
   * @public
   */
  addPhetioObject( phetioObject ) {
    assert && assert( arguments.length === 1, 'Tandem.addPhetioObject takes one argument' );

    // Cannot use typical require statement for PhetioObject because it creates a module loading loop
    assert && assert( phetioObject instanceof tandemNamespace.PhetioObject, 'argument should be of type PhetioObject' );

    if ( PHET_IO_ENABLED ) {

      // Throw an error if the tandem is required but not supplied
      if ( Tandem.errorOnFailedValidation() ) {
        assert && assert( !( this.required && !this.supplied ), 'Tandem was required but not supplied' );
      }

      // When the query parameter phetioPrintMissingTandems is true, report tandems that are required but not supplied
      if ( PRINT_MISSING_TANDEMS && ( this.required && !this.supplied ) ) {
        missingTandems.required.push( { phetioID: this.phetioID, stack: new Error().stack } );
        return;
      }

      // If tandem is optional and not supplied, then ignore it.
      if ( !this.required && !this.supplied ) {
        if ( PRINT_MISSING_TANDEMS ) {
          const stackTrace = new Error().stack;

          // When the query parameter phetioPrintMissingTandems is true, report tandems that are optional but not
          // supplied, but not for Fonts because they are too numerous.
          if ( stackTrace.indexOf( 'Font' ) === -1 ) {
            missingTandems.optional.push( { phetioID: this.phetioID, stack: stackTrace } );
            return;
          }
        }

        // Optionally instrumented types without tandems are not added.
        return;
      }

      if ( !launched ) {
        bufferedPhetioObjects.push( phetioObject );
      }
      else {
        for ( let i = 0; i < phetioObjectListeners.length; i++ ) {
          phetioObjectListeners[ i ].addPhetioObject( phetioObject );
        }
      }
    }
  }

  /**
   * Removes a PhetioObject and signifies to listeners that it has been removed.
   * @param {PhetioObject} phetioObject
   * @public
   */
  removePhetioObject( phetioObject ) {

    if ( !this.required && !this.supplied ) {
      return;
    }

    // Only active when running as phet-io
    if ( PHET_IO_ENABLED ) {
      if ( !launched ) {
        assert && assert( bufferedPhetioObjects.indexOf( phetioObject ) >= 0, 'should contain item' );
        arrayRemove( bufferedPhetioObjects, phetioObject );
      }
      else {
        for ( let i = 0; i < phetioObjectListeners.length; i++ ) {
          phetioObjectListeners[ i ].removePhetioObject( phetioObject );
        }
      }
    }
  }

  /**
   * Used for creating new tandems, extends this Tandem's options with the passed-in options.
   * @param {Object} [options]
   * @returns {Object} -extended options
   * @public
   */
  getExtendedOptions( options ) {

    // Any child of something should be passed all inherited options. Make sure that this extend call includes all
    // that make sense from the constructor's extend call.
    return merge( {
      supplied: this.supplied,
      required: this.required
    }, options );
  }

  /**
   * Create a new Tandem by appending the given id
   * @param {string} name
   * @param {Object} [options]
   * @returns {Tandem}
   * @public
   */
  createTandem( name, options ) {
    return new Tandem( this, name, this.getExtendedOptions( options ) );
  }

  /**
   * For API validation, each PhetioObject has a corresponding concrete PhetioObject for comparison. Non-dynamic
   * PhetioObjects have the trivial case where its concrete phetioID is the same as its phetioID.
   *
   * @returns {string}
   * @public
   */
  getConcretePhetioID() {

    // Dynamic elements always have a parent container, hence since this does not have a parent, it must already be concrete
    return this.parentTandem ? phetio.PhetioIDUtils.append( this.parentTandem.getConcretePhetioID(), this.name ) : this.phetioID;
  }

  /**
   * Creates a group tandem for creating multiple indexed child tandems, such as:
   * sim.screen.model.electrons~0
   * sim.screen.model.electrons~1
   *
   * In this case, 'sim.screen.model.electron' is the string passed to createGroupTandem.
   *
   * Used for arrays, observable arrays, or when many elements of the same type are created and they do not otherwise
   * have unique identifiers.
   * @param {string} name
   * @returns {GroupTandem}
   * @deprecated - use PhetioGroup instead
   * @public
   */
  createGroupTandem( name ) {

    assert && deprecationWarning( 'Tandem.createGroupTandem is deprecated, please use PhetioGroup instead' );

    return new GroupTandem( this, name );
  }

  /**
   * Adds a listener that will be notified when items are registered/deregistered
   * Listeners have the form
   * {
   *   addPhetioObject(id,phetioObject),
   *   removePhetioObject(id,phetioObject)
   * }
   * where id is of type {string} and phetioObject is of type {PhetioObject}
   *
   * @param {Object} phetioObjectListener - described above
   * @public
   * @static
   */
  static addPhetioObjectListener( phetioObjectListener ) {
    phetioObjectListeners.push( phetioObjectListener );
  }

  /**
   * After all listeners have been added, then Tandem can be launched.  This registers all of the buffered PhetioObjects
   * and subsequent PhetioObjects will be registered directly.
   * @public
   * @static
   */
  static launch() {
    assert && assert( !launched, 'Tandem cannot be launched twice' );
    launched = true;
    while ( bufferedPhetioObjects.length > 0 ) {
      const phetioObject = bufferedPhetioObjects.shift();
      phetioObject.tandem.addPhetioObject( phetioObject );
    }
    assert && assert( bufferedPhetioObjects.length === 0, 'bufferedPhetioObjects should be empty' );
  }

  /**
   * ONLY FOR TESTING!!!!
   * This was created to "undo" launch so that tests can better expose cases around calling Tandem.launch()
   * @public (tests only)
   */
  static unlaunch() {
    launched = false;
    bufferedPhetioObjects.length = 0;
  }

  /**
   * Determine whether or not tandem validation failures should throw errors. If we are printing the missing tandems,
   * then no error should be thrown so that all problems are printed.
   * @returns {boolean} If tandems are being validated or not.
   * @public
   * @static
   */
  static errorOnFailedValidation() {
    return VALIDATE_TANDEMS && !PRINT_MISSING_TANDEMS;
  }

  /**
   * Given a phetioID, recursively create the Tandem structure needed to return a {Tandem} with the given phetioID.
   * This method is mostly to support a deprecated way of handling groups and state, please see @zepumph or @samreid
   * before using.
   * @deprecated
   * @param {string} phetioID
   * @returns {Tandem}
   * @public
   */
  static createFromPhetioID( phetioID ) {

    assert && deprecationWarning( 'Tandem.createFromPhetioID is deprecated, please use tandem.createTandem() instead' );

    return phetioID.split( '.' ).reduce( ( tandem, nextComponent ) => {

      // first call case where tandem starts as the first string in the list
      if ( typeof tandem === 'string' ) {
        tandem = new Tandem( null, tandem );
      }
      return tandem.createTandem( nextComponent );
    } );
  }
}

// The next few statics are created outside the static block because they instantiate Tandem instances.

/**
 * The root tandem for a simulation
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.ROOT = new Tandem( null, _.camelCase( packageJSON.name ) );

/**
 * Many simulation elements are nested under "general". This tandem is for elements that exists in all sims. For a
 * place to put simulation specific globals, see `Tandem.GLOBAL`
 *
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.GENERAL = Tandem.ROOT.createTandem( phetio.PhetioIDUtils.GENERAL_COMPONENT_NAME );

/**
 * Tandem for model simulation elements that are general to all sims.
 *
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.GENERAL_MODEL = Tandem.GENERAL.createTandem( phetio.PhetioIDUtils.MODEL_COMPONENT_NAME );

/**
 * Tandem for view simulation elements that are general to all sims.
 *
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.GENERAL_VIEW = Tandem.GENERAL.createTandem( phetio.PhetioIDUtils.VIEW_COMPONENT_NAME );

/**
 * Simulation elements that don't belong in screens should be nested under "global". Note that this tandem should only
 * have simulation specific elements in them. Instrument items used by all sims under `Tandem.GENERAL`. Most
 * likely simulations elements should not be directly under this, but instead either under the model or view sub
 * tandems.
 *
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.GLOBAL = Tandem.ROOT.createTandem( phetio.PhetioIDUtils.GLOBAL_COMPONENT_NAME );

/**
 * Model simulation elements that don't belong in specific screens should be nested under this Tandem. Note that this
 * tandem should only have simulation specific elements in them.
 *
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.GLOBAL_MODEL = Tandem.GLOBAL.createTandem( phetio.PhetioIDUtils.MODEL_COMPONENT_NAME );

/**
 * View simulation elements that don't belong in specific screens should be nested under this Tandem. Note that this
 * tandem should only have simulation specific elements in them.
 *
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.GLOBAL_VIEW = Tandem.GLOBAL.createTandem( phetio.PhetioIDUtils.VIEW_COMPONENT_NAME );

/**
 * Used to indicate a common code component that supports tandem, but doesn't not require it.  If a tandem is not
 * passed in, then it will not be instrumented.
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.OPTIONAL = Tandem.ROOT.createTandem( 'optionalTandem', {
  required: false,
  supplied: false
} );

/**
 * To be used exclusively to opt out of situations where a tandem is required.
 * See https://github.com/phetsims/tandem/issues/97.
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.OPT_OUT = Tandem.OPTIONAL;

/**
 * Some common code (such as Checkbox or RadioButton) must always be instrumented.
 * @public
 * @constant
 * @type {Tandem}
 */
Tandem.REQUIRED = Tandem.ROOT.createTandem( 'requiredTandem', {

  // let phetioPrintMissingTandems bypass this
  required: VALIDATE_TANDEMS || PRINT_MISSING_TANDEMS,
  supplied: false
} );

/**
 * Expose collected missing tandems only populated from specific query parameter, see phetioPrintMissingTandems
 * @public (phet-io internal)
 * @type {Object}
 */
Tandem.missingTandems = missingTandems;

/**
 * If PhET-iO is enabled in this runtime.
 * @public
 * @type {boolean}
 */
Tandem.PHET_IO_ENABLED = PHET_IO_ENABLED;

/**
 * Group Tandem -- Declared in the same file to avoid circular reference errors in module loading.
 * TODO: Replace GroupTandem usages with DynamicTandem, see https://github.com/phetsims/tandem/issues/87 and https://github.com/phetsims/phet-io/issues/1409
 */
class GroupTandem extends Tandem {

  /**
   * @param {Tandem} parentTandem
   * @param {string} name
   * @constructor
   * @deprecated - see PhetioGroup.js for the way of the future
   * @private create with Tandem.createGroupTandem
   */
  constructor( parentTandem, name ) {
    super( parentTandem, name );

    assert && deprecationWarning( 'GroupTandem is deprecated, please use PhetioGroup instead' );

    // @private for generating indices from a pool
    this.groupMemberIndex = 0;
  }

  /**
   * Creates the next tandem in the group.
   * @returns {Tandem}
   * @public
   */
  createNextTandem() {
    return Tandem.createFromPhetioID( this.phetioID + '~' + ( this.groupMemberIndex++ ) );
  }
}

tandemNamespace.register( 'Tandem', Tandem );
export default Tandem;