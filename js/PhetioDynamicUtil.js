// Copyright 2019, University of Colorado Boulder

/**
 * Shared code between PhetioGroup and PhetioCapsule.
 *
 * @author Michael Kauzmann (PhET Interactive Simulations)
 */
define( require => {
  'use strict';

  // modules
  const DynamicTandem = require( 'TANDEM/DynamicTandem' );
  const merge = require( 'PHET_CORE/merge' );
  const phetioAPIValidation = require( 'TANDEM/phetioAPIValidation' );
  const PhetioObject = require( 'TANDEM/PhetioObject' );
  const Tandem = require( 'TANDEM/Tandem' );
  const tandemNamespace = require( 'TANDEM/tandemNamespace' );
  const validate = require( 'AXON/validate' );

  class PhetioDynamicUtil {

    /**
     * Archetypes are created to generate the baseline file, or to validate against an existing baseline file.  They are
     * PhetioObjects and registered with the phetioEngine, but not send out via notifications for phetioObjectAddedListeners,
     * because they are intended for internal usage only.  Archetypes should not be created in production code.
     * @param {Tandem} tandem
     * @param {function} create - function that creates a PhetioObject which will serve as the archetype
     * @param {Array.<*>|function.<[],Array.<*>>} defaultArguments arguments passed to create during API harvest
     * @returns {null|*}
     * @public
     */
    static createArchetype( tandem, create, defaultArguments ) {

      // Once the sim has started, any archetypes being created are likely done so because they are nested PhetioGroups.
      if ( phetioAPIValidation.simHasStarted ) {
        return null;
      }

      // When generating the baseline, output the schema for the archetype
      if ( ( phet.phetio && phet.phetio.queryParameters.phetioPrintPhetioFiles ) || phetioAPIValidation.enabled ) {
        const defaultArgs = Array.isArray( defaultArguments ) ? defaultArguments : defaultArguments();

        // The create function takes a tandem plus the default args
        assert && assert( create.length === defaultArgs.length + 1, 'mismatched number of arguments' );

        const archetype = create( tandem.createTandem( DynamicTandem.DYNAMIC_ARCHETYPE_NAME ), ...defaultArgs );

        // Mark the archetype for inclusion in the baseline schema
        archetype.markDynamicElementArchetype();
        return archetype;
      }
      else {
        return null;
      }
    }

    /**
     * Static function to create a dynamic PhetioObject
     * @param {Tandem} parentTandem
     * @param {string} componentName
     * @param {function(Tandem[, ...*]):PhetioObject} createFunction
     * @param {Array.<*>} argsForCreateFunction
     * @param {function(new:ObjectIO)} containerParameterType
     * @returns {PhetioObject}
     * @public
     */
    static createDynamicPhetioObject( parentTandem, componentName, createFunction, argsForCreateFunction, containerParameterType ) {
      assert && assert( Array.isArray( argsForCreateFunction ), 'should be array' );

      // create with default state and substructure, details will need to be set by setter methods.
      const createdObjectTandem = new DynamicTandem( parentTandem, componentName, parentTandem.getExtendedOptions() );
      const createdObject = createFunction( createdObjectTandem, ...argsForCreateFunction );

      // Make sure the new group member matches the schema for members.
      validate( createdObject, containerParameterType.validator );

      assert && assert( createdObject.phetioType === containerParameterType,
        'dynamic element container expected its created instance\'s phetioType to match its parameterType.' );

      assert && PhetioDynamicUtil.assertDynamicPhetioObject( createdObject );

      return createdObject;
    }

    /**
     * A dynamic member should be an instrumented PhetioObject with phetioDynamicElement: true
     * @param {PhetioObject} phetioObject - object to be validated
     * @public
     * @static
     */
    static assertDynamicPhetioObject( phetioObject ) {
      if ( Tandem.PHET_IO_ENABLED ) {
        assert && assert( phetioObject instanceof PhetioObject, 'instance should be a PhetioObject' );
        assert && assert( phetioObject.isPhetioInstrumented(), 'instance should be instrumented' );
        assert && assert( phetioObject.phetioDynamicElement, 'instance should be marked as phetioDynamicElement:true' );
      }
    }

    /**
     * Emit a created or disposed event.
     * @param {PhetioGroup|PhetioCapsule} container
     * @param {PhetioObject} dynamicElement
     * @param {string} eventName
     * @param {Object} [additionalData] additional data for the event
     * @private
     */
    static eventListener( container, dynamicElement, eventName, additionalData ) {
      container.phetioStartEvent( eventName, merge( {
        phetioID: dynamicElement.tandem.phetioID
      }, additionalData ) );
      container.phetioEndEvent();
    }

    /**
     * Emit events when dynamic elements are created.
     * @param {PhetioGroup|PhetioCapsule} container
     * @param {PhetioObject} dynamicElement
     * @public
     */
    static createdEventListener( container, dynamicElement ) {
      const additionalData = dynamicElement.phetioState ? {
        state: container.phetioType.parameterTypes[ 0 ].toStateObject( dynamicElement )
      } : null;
      PhetioDynamicUtil.eventListener( container, dynamicElement, 'created', additionalData );
    }

    /**
     * Emit events when dynamic elements are disposed.
     * @param {PhetioGroup|PhetioCapsule} container
     * @param {PhetioObject} dynamicElement
     * @public
     */
    static disposedEventListener( container, dynamicElement ) {
      PhetioDynamicUtil.eventListener( container, dynamicElement, 'disposed' );
    }
  }

  return tandemNamespace.register( 'PhetioDynamicUtil', PhetioDynamicUtil );
} );

