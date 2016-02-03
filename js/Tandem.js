// Copyright 2015, University of Colorado Boulder

/**
 * Tandem is a general instance registry that can be used to track creation/disposal of instances in PhET Simulations.
 * It is used for together.js instrumentation for PhET-iO support.
 *
 * @author Sam Reid (PhET Interactive Simulations)
 */
define( function( require ) {
  'use strict';

  // modules
  var inherit = require( 'PHET_CORE/inherit' );
  var tandemNamespace = require( 'TANDEM/tandemNamespace' );
  var StringUtils = require( 'PHETCOMMON/util/StringUtils' );

  // text
  var packageString = require( 'text!REPOSITORY/package.json' );

  // constants
  var packageJSON = JSON.parse( packageString );

  /**
   * @param {string} id - id as a string (or '' for a root id)
   * @constructor
   */
  function Tandem( id ) {

    // @public {read-only}
    this.id = (id !== undefined) ? id : '';
  }

  tandemNamespace.register( 'Tandem', Tandem );

  // Listeners that will be notified when items are registered/deregistered
  var instanceListeners = [];

  inherit( Object, Tandem, {

    /**
     * Adds an instance of any type.  For example, it could be an axon Property, scenery Node or Sun button.  Each
     * item should only be added to the registry once, but that is not enforced here in Tandem.
     *
     * This is used to register instances with together.
     * @param {Object} instance - the instance to add
     * @public
     */
    addInstance: function( instance ) {
      for ( var i = 0; i < instanceListeners.length; i++ ) {
        instanceListeners[ i ].addInstance( this.id, instance );
      }
    },

    /**
     * Removes an instance from the
     * @param {Object} instance - the instance to remove
     * @public
     */
    removeInstance: function( instance ) {
      for ( var i = 0; i < instanceListeners.length; i++ ) {
        instanceListeners[ i ].removeInstance( this.id, instance );
      }
    },

    /**
     * Create a new Tandem by appending the given id
     * @param {string} id
     * @returns {Tandem}
     * @public
     */
    createTandem: function( id ) {
      var string = (this.id.length > 0) ? (this.id + '.' + id) : id;
      return new Tandem( string );
    },

    /**
     * Creates a group tandem for creating multiple indexed child tandems, such as:
     * sim.screen.model.electron_0
     * sim.screen.model.electron_1
     *
     * In this case, 'sim.screen.model.electron' is the group tandem id.
     *
     * Used for arrays, observable arrays, or when many elements of the same type are created and they do not otherwise
     * have unique identifiers.
     * @param id
     * @returns {GroupTandem}
     */
    createGroupTandem: function( id ) {

      // Unfortunately we must resort to globals here since loading through the namespace would create a cycle
      return new GroupTandem( this.id + '.' + id );
    },

    /**
     * Get the last part of the tandem (after the last .), used in Joist for creating button names dynamically based
     * on screen names
     * @return {string} the tail of the tandem
     */
    get tail() {
      assert && assert( this.id.indexOf( '.' ) >= 0, 'tandem ID does not have a tail' );

      var lastIndexOfDot = this.id.lastIndexOf( '.' );
      var tail = this.id.substring( lastIndexOfDot + 1 );
      assert && assert( tail.length > 0, 'tandem ID did not have a tail' );
      return tail;
    },

    /**
     * When using subtyping, the instance listeners must only be notified once rather than once for every level
     * in the inheritance hierarchy.  When a subtype constructor has a tandem.addInstance call, it should
     * pass a supertype tandem to the parent constructor so that it won't try to register the item twice.
     * @returns {SupertypeTandem}
     */
    createSupertypeTandem: function() {
      return new SupertypeTandem( this.id );
    }
  }, {

    /**
     * Adds a listener that will be notified when items are registered/deregistered
     * Listeners have the form
     * {
     *   addInstance(id,instance),   
     *   removeInstance(id,instance)
     * }
     * where id is of type {string} and instance is of type {Object}
     *
     * @param {Object} instanceListener - described above
     * @public
     * @static
     */
    addInstanceListener: function( instanceListener ) {
      instanceListeners.push( instanceListener );
    },

    /**
     * Create a tandem based on the name of the running simulation.
     * @returns {Tandem}
     */
    createRootTandem: function() {
      return new Tandem( StringUtils.toCamelCase( packageJSON.name ) );
    },

    /**
     * Create a child of the root tandem.
     * @param {string} name
     * @returns {Tandem}
     */
    createStaticTandem: function( name ) {
      return Tandem.createRootTandem().createTandem( name );
    }
  } );

  // Tandem checks for listeners added before the Tandem module was loaded.  This is necessary so that together.js can 
  // receive notifications about items created during static initialization such as Solute.js
  // which is created before Sim.js runs.
  if ( window.tandemPreloadInstanceListeners ) {
    for ( var i = 0; i < window.tandemPreloadInstanceListeners.length; i++ ) {
      Tandem.addInstanceListener( window.tandemPreloadInstanceListeners[ i ] );
    }
  }

  /**
   * @param {string} id - id as a string (or '' for a root id)
   * @constructor
   * @private create with Tandem.createGroupTandem
   * Declared in the same file to avoid circular reference errors in module loading.
   */
  function GroupTandem( id ) {

    Tandem.call( this, id );

    // @private for generating indices from a pool
    this.groupElementIndex = 0;
  }

  tandemNamespace.register( 'Tandem.GroupTandem', GroupTandem );

  inherit( Tandem, GroupTandem, {

    /**
     * @param [id] {string} optional override, used when loading a state and the tandems must be restored exactly as
     * they were saved
     * @returns {Tandem}
     */
    createSpecificTandem: function( id ) {
      return new Tandem( this.id + '_' + id );
    },

    createNextTandem: function() {
      return new Tandem( this.id + '_' + (this.groupElementIndex++) );
    }
    }
  );

  /**
   * @param {string} id - id as a string (or '' for a root id)
   * @constructor
   * @private create with Tandem.createSupertypeTandem
   */
  function SupertypeTandem( id ) {
    Tandem.call( this, id );
  }

  tandemNamespace.register( 'Tandem.SupertypeTandem', SupertypeTandem );

  inherit( Tandem, SupertypeTandem, {

      // @public - Override to make no-op, see createSupertypeTandem
      addInstance: function( instance ) {},

      // @public - Override to make no-op, see createSupertypeTandem
      removeInstance: function( instance ) {}
    }
  );

  return Tandem;
} );