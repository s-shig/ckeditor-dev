/* bender-tags: editor, clipboard, 13872 */
/* bender-ckeditor-plugins: toolbar, clipboard, pastetext */

'use strict';

bender.editors = {
	classic: {
		config: {
			readOnly: true
		}
	},
	classic_editable: {},
	inline: {
		creator: 'inline',
		config: {
			readOnly: true
		}
	},
	inline_editable: {
		creator: 'inline'
	}
};

var tests = {
	setUp: function() {
		// The native handling of copy/cut doesn't have such problems.
		if ( !CKEDITOR.plugins.clipboard.isCustomCopyCutSupported ) {
			assert.ignore();
		}

		this.initPasteSpy = sinon.spy( CKEDITOR.plugins.clipboard, 'initPasteDataTransfer' );
	},

	tearDown: function() {
		this.initPasteSpy.restore();
	},

	'test if cut is prevented depending on read-only mode': function( editor, bot ) {
		var content = '<p>[Some t]ext</p>',
			expected = editor.readOnly ? content : '<p>^ext</p>';

		bot.setHtmlWithSelection( content );

		editor.editable().fire( 'cut', new CKEDITOR.dom.event( {} ) );

		assert.areSame( expected, bot.htmlWithSelection() );
		assert.areSame( !editor.readOnly, CKEDITOR.plugins.clipboard.initPasteDataTransfer.called, 'initPasteDataTransfer call' );
	},

	'test copy depending on read-only mode': function( editor, bot ) {
		bot.setHtmlWithSelection( '<p>[Some] text</p>' );

		editor.editable().fire( 'copy', new CKEDITOR.dom.event( {} ) );

		assert.areSame( true, CKEDITOR.plugins.clipboard.initPasteDataTransfer.called, 'initPasteDataTransfer call' );
	}
};

tests = bender.tools.createTestsForEditors( CKEDITOR.tools.objectKeys( bender.editors ), tests );

tests = CKEDITOR.tools.object.merge( tests, {
	// (#2775)
	'test paste command state in divarea editor': function() {
		bender.editorBot.create( {
			name: 'divarea',
			creator: 'replace',
			config: {
				extraPlugins: 'divarea'
			}
		}, function( bot ) {
			var editor = bot.editor,
				commandNames = [ 'paste', 'pastetext' ],
				target = CKEDITOR.env.ie ? editor.editable() : editor.document.getDocumentElement();

			target.fire( 'mouseup', new CKEDITOR.dom.event( {
				button: CKEDITOR.MOUSE_BUTTON_LEFT,
				target: editor.editable()
			} ) );

			editor.setReadOnly( true );

			// mouseup listener updates state in timeout, so we need to make test asynchronous.
			setTimeout( function() {
				resume( function() {
					assertCommands( CKEDITOR.TRISTATE_DISABLED, 'true' );

					editor.setReadOnly( false );
					assertCommands( CKEDITOR.TRISTATE_OFF, 'false.' );
				} );
			} );

			wait();

			function assertCommands( expected, msg ) {
				CKEDITOR.tools.array.forEach( commandNames, function( commandName ) {
					var state = editor.getCommand( commandName ).state;
					assert.areSame( expected, state, commandName + ' state when readonly=' + msg );
				} );
			}
		} );
	}
} );

bender.test( tests );
