// Copyright 2015-2019, University of Colorado Boulder

/**
 * Tandem defines a set of trees that are used to assign unique identifiers to PhetioObjects in PhET simulations and
 * register/unregister them in a registry. It is used to support PhET-iO.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const toCamelCase = require( 'PHET_CORE/toCamelCase' );

  // text
  const packageString = require( 'text!REPOSITORY/package.json' );

  // constants
  const packageJSON = JSON.parse( packageString ); // Tandem can't depend on joist, so cannot use packageJSON module
  const GROUP_SEPARATOR = phetio.PhetioIDUtils.GROUP_SEPARATOR;
  const PHET_IO_ENABLED = !!( window.phet && window.phet.phetio );
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

      // options (even subtype options) must be stored on the instance so they can be passed through to children
      // Note: Make sure that added options here are also added to options for inheritance and/or for composition
      // (createTandem/parentTandem/getExtendedOptions) as appropriate.
      options = _.extend( {

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
     * Returns the regular expression which can be used to test each term.
     * @returns {RegExp}
     * @protected
     */
    getTermRegex() {
      return /^[a-zA-Z0-9~]+$/; // TODO: eliminate ~ once GroupTandem has been deleted, see https://github.com/phetsims/tandem/issues/87
    }

    /**
     * Adds a PhetioObject.  For example, it could be an axon Property, SCENERY/Node or SUN/RoundPushButton.  Each item
     * should only be added to the registry once, but that is not enforced here in Tandem since Tandem does not maintain
     * the registry.  For PhET-iO, phetioEngine.js enforces one entry per ID in phetio.phetioObjectAdded.
     *
     * This is used to register PhetioObjects with PhET-iO.
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

        // phetioPrintMissingTandems flag is present for a tandem that is required but not supplied.
        if ( PRINT_MISSING_TANDEMS && ( this.required && !this.supplied ) ) {
          missingTandems.required.push( { phetioID: this.phetioID, stack: new Error().stack } );
        }

        // If tandem is optional, then don't add it
        if ( !this.required && !this.supplied ) {
          if ( PRINT_MISSING_TANDEMS ) {
            const stackTrace = new Error().stack;

            // Report tandems that are optional but not supplied, but not for Fonts because they are too numerous.
            if ( stackTrace.indexOf( 'Font' ) === -1 ) {
              missingTandems.optional.push( { phetioID: this.phetioID, stack: stackTrace } );
            }
          }

          // For optionally instrumented types that are not provided tandems, the instance isn't really "added"
          // but likewise, it in not an error
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
     * Removes an instance from the registry
     * @param {PhetioObject} phetioObject - the instance to remove
     * @public
     */
    removeInstance( phetioObject ) {

      // TODO: Should we add code to make it possible to remove elements from buffer? see https://github.com/phetsims/phet-io/issues/1409
      assert && assert( launched, 'removing from buffer not yet supported.' );
      if ( !this.required && !this.supplied ) {
        return;
      }

      // Only active when running as phet-io
      if ( PHET_IO_ENABLED ) {
        for ( let i = 0; i < phetioObjectListeners.length; i++ ) {
          phetioObjectListeners[ i ].removePhetioObject( phetioObject );
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
      return _.extend( {
        supplied: this.supplied,
        required: this.required
      }, options );
    }

    /**
     * Create a new Tandem by appending the given id
     * @param {string} id
     * @param {Object} [options]
     * @returns {Tandem}
     * @public
     */
    createTandem( id, options ) {

      // This assertion isn't in the constructor because a subtype of Tandem allows this character.
      assert && assert( id.indexOf( GROUP_SEPARATOR ) === -1, `invalid character in non-group tandem: ${GROUP_SEPARATOR}` );

      return new Tandem( this, id, this.getExtendedOptions( options ) );
    }

    /**
     * Tacks on this Tandem's suffix to the given parentPhetioID, used to look up concrete phetioIDs
     * @param {string} parentPhetioID
     * @returns {string}
     * @protected
     */
    appendConcreteSuffix( parentPhetioID ) {
      return phetio.PhetioIDUtils.append( parentPhetioID, this.name );
    }

    /**
     * A dynamic phetioID contains text like .................'sim.screen1.particles.particles_7.visibleProperty'
     * which corresponds to the prototype "quark" ....
     * This method looks up the corresponding prototype like..'sim.screen1.particles.prototypes.quark.visibleProperty'
     *
     * NOTE: This function makes a lot of assumptions about the look of phetioIDs that are made in Group.js, don't change
     * one without consulting the other.
     * @returns {string}
     * @public
     */
    getConcretePhetioID() {

      // Dynamic elements always have a parent container, hence since this does not have a parent, it must already be concrete
      return this.parentTandem ? this.appendConcreteSuffix( this.parentTandem.getConcretePhetioID() ) : this.phetioID;
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
     * @deprecated - use GroupMemberTandem instead
     * @public
     */
    createGroupTandem( name ) {
      return new GroupTandem( this, name );
    }

    /**
     * The Tandem base class is not a GroupMemberTandem, but GroupMemberTandem overrides this function to specify
     * that it is dynamic. If effect this function is a replacement for checking `x instanceof GroupMemberTandem` in
     * the Tandem base class.
     * @returns {boolean}
     * @protected
     */
    isGroupMember() {
      return false;
    }

    /**
     * Whether this tandem is a GroupMemberTandem or if any parents are. If this is the case, then this tandem is dynamic.
     * @returns {boolean}
     * @public
     */
    isGroupMemberOrDescendant() {
      return this.isGroupMember() || ( !!this.parentTandem && this.parentTandem.isGroupMember() );
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
        phetioObject.register();
      }
      assert && assert( bufferedPhetioObjects.length === 0, 'bufferedPhetioObjects should be empty' );
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
   * @static
   * @type {Tandem}
   */
  Tandem.rootTandem = new Tandem( null, toCamelCase( packageJSON.name ) );

  /**
   * Many simulation elements are nested under "general".
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.generalTandem = Tandem.rootTandem.createTandem( 'general' );

  /**
   * Used to indicate a common code component that supports tandem, but doesn't not require it.
   * If a tandem is not passed through to this instance, then it will not be instrumented.
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.optional = Tandem.rootTandem.createTandem( 'optionalTandem', {
    required: false,
    supplied: false
  } );

  /**
   * Some common code (such as Checkbox or RadioButton) must always be instrumented.
   * @public
   * @static
   * @type {Tandem}
   */
  Tandem.required = Tandem.rootTandem.createTandem( 'requiredTandem', {

    // let phetioPrintMissingTandems bypass this
    required: VALIDATE_TANDEMS || PRINT_MISSING_TANDEMS,
    supplied: false
  } );

  /**
   * Expose collected missing tandems only populated from specific query parameter, see phetioPrintMissingTandems
   * @public (phet-io internal)
   * @type {Object}
   * @public
   */
  Tandem.missingTandems = missingTandems;

  /**
   * Group Tandem -- Declared in the same file to avoid circular reference errors in module loading.
   * TODO: Replace GroupTandem usages with GroupMemberTandem, see https://github.com/phetsims/tandem/issues/87 and https://github.com/phetsims/phet-io/issues/1409
   */
  class GroupTandem extends Tandem {

    /**
     * @param {Tandem} parentTandem
     * @param {string} name
     * @constructor
     * @deprecated - see Group.js for the way of the future
     * @private create with Tandem.createGroupTandem
     */
    constructor( parentTandem, name ) {
      super( parentTandem, name );

      // @private for generating indices from a pool
      this.groupElementIndex = 0;
    }

    /**
     * Creates the next tandem in the group.
     * @returns {Tandem}
     * @public
     */
    createNextTandem() {
      return Tandem.createFromPhetioID( this.phetioID + '~' + ( this.groupElementIndex++ ) );
    }
  }

  return tandemNamespace.register( 'Tandem', Tandem );
} );