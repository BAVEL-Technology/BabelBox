
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.32.3' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev('SvelteDOMSetProperty', { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/Header.svelte generated by Svelte v3.32.3 */

    const { console: console_1 } = globals;
    const file = "src/Header.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (168:10) {:else}
    function create_else_block(ctx) {
    	let span;
    	let t0_value = /*data*/ ctx[21].name[0].toUpperCase() + /*data*/ ctx[21].name.substring(1) + "";
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let if_block = /*data*/ ctx[21].name == /*activeTable*/ ctx[1] && /*data*/ ctx[21].owner == /*currentUser*/ ctx[3].username && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span, "class", "truncate");
    			add_location(span, file, 168, 12, 6850);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*dataTables*/ 1 && t0_value !== (t0_value = /*data*/ ctx[21].name[0].toUpperCase() + /*data*/ ctx[21].name.substring(1) + "")) set_data_dev(t0, t0_value);

    			if (/*data*/ ctx[21].name == /*activeTable*/ ctx[1] && /*data*/ ctx[21].owner == /*currentUser*/ ctx[3].username) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(168:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (163:10) {#if editable == data.name}
    function create_if_block(ctx) {
    	let input;
    	let input_value_value;
    	let input_id_value;
    	let t;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[17](/*data*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(input, "class", "apperance-none focus:outline-none w-auto bg-green-600 border-none");
    			input.value = input_value_value = /*data*/ ctx[21].name[0].toUpperCase() + /*data*/ ctx[21].name.substring(1);
    			attr_dev(input, "id", input_id_value = /*data*/ ctx[21].name.replace(/ /g, "-"));
    			add_location(input, file, 163, 12, 6311);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M5 13l4 4L19 7");
    			add_location(path, file, 165, 14, 6709);
    			attr_dev(svg, "class", "h-3 w-3 text-green-200 ml-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file, 164, 12, 6501);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*dataTables*/ 1 && input_value_value !== (input_value_value = /*data*/ ctx[21].name[0].toUpperCase() + /*data*/ ctx[21].name.substring(1)) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*dataTables*/ 1 && input_id_value !== (input_id_value = /*data*/ ctx[21].name.replace(/ /g, "-"))) {
    				attr_dev(input, "id", input_id_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(163:10) {#if editable == data.name}",
    		ctx
    	});

    	return block;
    }

    // (170:12) {#if data.name == activeTable && data.owner == currentUser.username}
    function create_if_block_1(ctx) {
    	let div;
    	let svg0;
    	let path0;
    	let t;
    	let svg1;
    	let path1;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[18](/*data*/ ctx[21]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[19](/*data*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t = space();
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z");
    			add_location(path0, file, 172, 16, 7258);
    			attr_dev(svg0, "class", "h-3 w-3 text-green-200 ml-2");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file, 171, 14, 7073);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16");
    			add_location(path1, file, 175, 16, 7673);
    			attr_dev(svg1, "class", "h-3 w-3 text-green-200 ml-2");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file, 174, 14, 7467);
    			attr_dev(div, "class", "flex items-center");
    			add_location(div, file, 170, 12, 7027);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, svg0);
    			append_dev(svg0, path0);
    			append_dev(div, t);
    			append_dev(div, svg1);
    			append_dev(svg1, path1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(svg0, "click", click_handler_2, false, false, false),
    					listen_dev(svg1, "click", click_handler_3, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(170:12) {#if data.name == activeTable && data.owner == currentUser.username}",
    		ctx
    	});

    	return block;
    }

    // (160:6) {#each dataTables as data}
    function create_each_block(ctx) {
    	let li;
    	let div;
    	let t0_value = /*data*/ ctx[21].owner[0].toUpperCase() + "";
    	let t0;
    	let t1;
    	let t2;
    	let li_class_value;
    	let mounted;
    	let dispose;

    	function select_block_type(ctx, dirty) {
    		if (/*editable*/ ctx[4] == /*data*/ ctx[21].name) return create_if_block;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[20](/*data*/ ctx[21]);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			attr_dev(div, "class", "h-3 w-3 rounded-full bg-green-200 flex items-center justify-center text-green-600 text-xs p-2 mr-2");
    			add_location(div, file, 161, 10, 6113);

    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(`w-auto border-r border-l border-t border-green-600 flex w-48 items-center justify-between py-1 px-2 rounded-tl-lg rounded-tr-lg text-sm font-medium bg-green-600 text-green-100 transform ${/*data*/ ctx[21].name == /*activeTable*/ ctx[1]
			? "scale-125 z-20"
			: "-ml-1"} origin-bottom shadow-lg cursor-pointer`) + " svelte-70ag7j"));

    			add_location(li, file, 160, 8, 5750);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, div);
    			append_dev(div, t0);
    			append_dev(li, t1);
    			if_block.m(li, null);
    			append_dev(li, t2);

    			if (!mounted) {
    				dispose = listen_dev(li, "click", click_handler_4, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*dataTables*/ 1 && t0_value !== (t0_value = /*data*/ ctx[21].owner[0].toUpperCase() + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(li, t2);
    				}
    			}

    			if (dirty & /*dataTables, activeTable*/ 3 && li_class_value !== (li_class_value = "" + (null_to_empty(`w-auto border-r border-l border-t border-green-600 flex w-48 items-center justify-between py-1 px-2 rounded-tl-lg rounded-tr-lg text-sm font-medium bg-green-600 text-green-100 transform ${/*data*/ ctx[21].name == /*activeTable*/ ctx[1]
			? "scale-125 z-20"
			: "-ml-1"} origin-bottom shadow-lg cursor-pointer`) + " svelte-70ag7j"))) {
    				attr_dev(li, "class", li_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			if_block.d();
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(160:6) {#each dataTables as data}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let div5;
    	let div3;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let p;
    	let t2;
    	let div2;
    	let ul0;
    	let li0;
    	let svg0;
    	let path0;
    	let t3;
    	let span0;
    	let t5;
    	let li1;
    	let svg1;
    	let path1;
    	let t6;
    	let span1;
    	let t8;
    	let li2;
    	let svg2;
    	let path2;
    	let t9;
    	let span2;
    	let t11;
    	let li3;
    	let input;
    	let t12;
    	let div1;

    	let t13_value = (/*currentUser*/ ctx[3]
    	? /*currentUser*/ ctx[3].username[0].toUpperCase()
    	: "") + "";

    	let t13;
    	let t14;
    	let div4;
    	let ul1;
    	let mounted;
    	let dispose;
    	let each_value = /*dataTables*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			p = element("p");
    			p.textContent = "Babel Database";
    			t2 = space();
    			div2 = element("div");
    			ul0 = element("ul");
    			li0 = element("li");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t3 = space();
    			span0 = element("span");
    			span0.textContent = "API Docs";
    			t5 = space();
    			li1 = element("li");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			t6 = space();
    			span1 = element("span");
    			span1.textContent = "Add Table";
    			t8 = space();
    			li2 = element("li");
    			svg2 = svg_element("svg");
    			path2 = svg_element("path");
    			t9 = space();
    			span2 = element("span");
    			span2.textContent = "Upload JSON";
    			t11 = space();
    			li3 = element("li");
    			input = element("input");
    			t12 = space();
    			div1 = element("div");
    			t13 = text(t13_value);
    			t14 = space();
    			div4 = element("div");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img, "class", "h-16 w-16 object-cover mr-6");
    			if (img.src !== (img_src_value = "./mongo.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 127, 2, 3506);
    			attr_dev(p, "class", "text-lg font-semibold text-green-600");
    			add_location(p, file, 128, 2, 3570);
    			attr_dev(div0, "class", "flex items-center ml-8 mt-4");
    			add_location(div0, file, 126, 2, 3462);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "3");
    			attr_dev(path0, "d", "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4");
    			add_location(path0, file, 134, 10, 4008);
    			attr_dev(svg0, "class", "h-4 w-4 text-green-600 mr-2");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file, 133, 8, 3867);
    			attr_dev(span0, "class", "text-sm font-semibold text-green-600 truncate");
    			add_location(span0, file, 136, 8, 4146);
    			attr_dev(li0, "class", "flex items-center cursor-pointer transform duration-150 hover:-translate-y-1");
    			add_location(li0, file, 132, 6, 3725);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "3");
    			attr_dev(path1, "d", "M12 6v6m0 0v6m0-6h6m-6 0H6");
    			add_location(path1, file, 140, 10, 4506);
    			attr_dev(svg1, "class", "h-4 w-4 text-green-600 mr-2");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file, 139, 8, 4364);
    			attr_dev(span1, "class", "text-sm font-semibold text-green-600 truncate");
    			add_location(span1, file, 142, 8, 4633);
    			attr_dev(li1, "class", "flex items-center cursor-pointer transform duration-150 hover:-translate-y-1");
    			add_location(li1, file, 138, 6, 4240);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2.5");
    			attr_dev(path2, "d", "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12");
    			add_location(path2, file, 146, 10, 4989);
    			attr_dev(svg2, "class", "h-4 w-4 text-green-600 mr-2");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "currentColor");
    			add_location(svg2, file, 145, 8, 4848);
    			attr_dev(span2, "class", "text-sm font-semibold text-green-600 truncate");
    			add_location(span2, file, 148, 8, 5177);
    			attr_dev(li2, "class", "flex items-center cursor-pointer transform duration-150 hover:-translate-y-1");
    			add_location(li2, file, 144, 6, 4728);
    			attr_dev(input, "id", "json-file");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "class", "invisible");
    			add_location(input, file, 151, 6, 5300);
    			attr_dev(li3, "class", "hidden");
    			add_location(li3, file, 150, 6, 5274);
    			attr_dev(ul0, "class", "flex space-x-4");
    			add_location(ul0, file, 131, 4, 3691);
    			attr_dev(div1, "class", "h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-green-200 text-lg p-2 mr-8 mt-4");
    			add_location(div1, file, 154, 4, 5441);
    			attr_dev(div2, "class", "flex space-x-4 mr-8 mt-4");
    			add_location(div2, file, 130, 2, 3648);
    			attr_dev(div3, "class", "flex w-full justify-between");
    			add_location(div3, file, 125, 2, 3418);
    			attr_dev(ul1, "class", "flex items-center px-4");
    			add_location(ul1, file, 158, 4, 5673);
    			attr_dev(div4, "class", "px-20 pt-12");
    			add_location(div4, file, 157, 2, 5643);
    			attr_dev(div5, "class", "example flex flex-col bg-green-200 border-b-4 border-green-600 w-screen overflow-x-scroll svelte-70ag7j");
    			add_location(div5, file, 124, 0, 3312);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div3);
    			append_dev(div3, div0);
    			append_dev(div0, img);
    			append_dev(div0, t0);
    			append_dev(div0, p);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, ul0);
    			append_dev(ul0, li0);
    			append_dev(li0, svg0);
    			append_dev(svg0, path0);
    			append_dev(li0, t3);
    			append_dev(li0, span0);
    			append_dev(ul0, t5);
    			append_dev(ul0, li1);
    			append_dev(li1, svg1);
    			append_dev(svg1, path1);
    			append_dev(li1, t6);
    			append_dev(li1, span1);
    			append_dev(ul0, t8);
    			append_dev(ul0, li2);
    			append_dev(li2, svg2);
    			append_dev(svg2, path2);
    			append_dev(li2, t9);
    			append_dev(li2, span2);
    			append_dev(ul0, t11);
    			append_dev(ul0, li3);
    			append_dev(li3, input);
    			append_dev(div2, t12);
    			append_dev(div2, div1);
    			append_dev(div1, t13);
    			append_dev(div5, t14);
    			append_dev(div5, div4);
    			append_dev(div4, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(li0, "click", /*click_handler*/ ctx[15], false, false, false),
    					listen_dev(li1, "click", /*createNewTable*/ ctx[5], false, false, false),
    					listen_dev(li2, "click", /*uploadFile*/ ctx[10], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentUser*/ 8 && t13_value !== (t13_value = (/*currentUser*/ ctx[3]
    			? /*currentUser*/ ctx[3].username[0].toUpperCase()
    			: "") + "")) set_data_dev(t13, t13_value);

    			if (dirty & /*dataTables, activeTable, activate, changeTableName, editable, deleteTable, editTable, currentUser*/ 987) {
    				each_value = /*dataTables*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div5);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { dataTables } = $$props;
    	let { activeTable } = $$props;
    	let { headers } = $$props;
    	let { fetchData } = $$props;
    	let { displayedData } = $$props;
    	let { currentUser } = $$props;
    	let { showAPIDocs } = $$props;
    	let editable;

    	const createNewTable = async () => {
    		const id = "Table " + Math.floor(Math.random() * Math.floor(100));

    		let newTable = await fetch(`/api/database`, {
    			method: "POST",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({ name: id, owner: currentUser.username })
    		});

    		let newTableResponse = await newTable.json();

    		if (newTableResponse.status == "duplicate") {
    			createNewTable();
    		}

    		const dataResponse = await fetch(`api/database`);
    		let data = await dataResponse.json();
    		$$invalidate(1, activeTable = id.toLowerCase());
    		$$invalidate(4, editable = id.toLowerCase());
    		$$invalidate(0, dataTables = data);
    	};

    	const activate = async table => {
    		$$invalidate(1, activeTable = table.replace(/-/g, " "));
    		const tableDataResposne = await fetchData(table);
    		let data = await tableDataResposne.json();
    		$$invalidate(13, displayedData = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == table.replace(/-/g, " "))[0];

    		if (tableHeaders) {
    			$$invalidate(12, headers = tableHeaders.props);

    			$$invalidate(12, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(12, headers = []);
    		}

    		console.log(table);
    		console.log(displayedData);
    		console.log(tableHeaders);
    		console.log(headers);
    	};

    	const editTable = table => {
    		$$invalidate(4, editable = table);
    	};

    	const changeTableName = async table => {
    		try {
    			let name = document.querySelector(`#${table}`).value;

    			let change = await fetch(`/api/database/${table}`, {
    				method: "PUT",
    				headers: {
    					"Accept": "application/json",
    					"Content-Type": "application/json"
    				},
    				body: JSON.stringify({ name })
    			});

    			const dataResponse = await fetch(`api/database`);
    			let data = await dataResponse.json();
    			let changeData = await change.json();
    			console.log(changeData);
    			$$invalidate(4, editable = "");
    			$$invalidate(0, dataTables = data);
    			$$invalidate(1, activeTable = name.toLowerCase());
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const deleteTable = async table => {
    		try {
    			await fetch(`/api/database/${table}`, { method: "DELETE" });
    			const dataResponse = await fetch(`api/database`);
    			let data = await dataResponse.json();
    			$$invalidate(4, editable = "");
    			$$invalidate(0, dataTables = data);
    			$$invalidate(1, activeTable = dataTables[0].name);
    			const tableDataResposne = await fetchData(activeTable);
    			data = await tableDataResposne.json();
    			$$invalidate(13, displayedData = data);
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const uploadFile = () => {
    		document.getElementById("json-file").click();
    	};

    	const importJSON = async table => {
    		try {
    			let photo = document.getElementById("json-file").files[0];
    			let formData = new FormData();
    			formData.append("filename", photo);
    			let data = await fetch(`/api/database/${table}/import`, { method: "POST", body: formData });
    			data = await data.json();
    			console.log(data);
    			const dataResponse = await fetch(`api/database`);
    			data = await dataResponse.json();
    			$$invalidate(0, dataTables = data);
    			const tableDataResposne = await fetchData(activeTable);
    			data = await tableDataResposne.json();
    			$$invalidate(13, displayedData = data);
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const writable_props = [
    		"dataTables",
    		"activeTable",
    		"headers",
    		"fetchData",
    		"displayedData",
    		"currentUser",
    		"showAPIDocs"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, showAPIDocs = !showAPIDocs);
    	const change_handler = () => importJSON(activeTable.replace(/ /g, "-"));
    	const click_handler_1 = data => changeTableName(data.name.replace(/ /g, "-"));
    	const click_handler_2 = data => editTable(data.name);
    	const click_handler_3 = data => deleteTable(data.name.replace(/ /g, "-"));
    	const click_handler_4 = data => activate(data.name.replace(/ /g, "-"));

    	$$self.$$set = $$props => {
    		if ("dataTables" in $$props) $$invalidate(0, dataTables = $$props.dataTables);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("headers" in $$props) $$invalidate(12, headers = $$props.headers);
    		if ("fetchData" in $$props) $$invalidate(14, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(13, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(3, currentUser = $$props.currentUser);
    		if ("showAPIDocs" in $$props) $$invalidate(2, showAPIDocs = $$props.showAPIDocs);
    	};

    	$$self.$capture_state = () => ({
    		dataTables,
    		activeTable,
    		headers,
    		fetchData,
    		displayedData,
    		currentUser,
    		showAPIDocs,
    		editable,
    		createNewTable,
    		activate,
    		editTable,
    		changeTableName,
    		deleteTable,
    		uploadFile,
    		importJSON
    	});

    	$$self.$inject_state = $$props => {
    		if ("dataTables" in $$props) $$invalidate(0, dataTables = $$props.dataTables);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("headers" in $$props) $$invalidate(12, headers = $$props.headers);
    		if ("fetchData" in $$props) $$invalidate(14, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(13, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(3, currentUser = $$props.currentUser);
    		if ("showAPIDocs" in $$props) $$invalidate(2, showAPIDocs = $$props.showAPIDocs);
    		if ("editable" in $$props) $$invalidate(4, editable = $$props.editable);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		dataTables,
    		activeTable,
    		showAPIDocs,
    		currentUser,
    		editable,
    		createNewTable,
    		activate,
    		editTable,
    		changeTableName,
    		deleteTable,
    		uploadFile,
    		importJSON,
    		headers,
    		displayedData,
    		fetchData,
    		click_handler,
    		change_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance, create_fragment, safe_not_equal, {
    			dataTables: 0,
    			activeTable: 1,
    			headers: 12,
    			fetchData: 14,
    			displayedData: 13,
    			currentUser: 3,
    			showAPIDocs: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*dataTables*/ ctx[0] === undefined && !("dataTables" in props)) {
    			console_1.warn("<Header> was created without expected prop 'dataTables'");
    		}

    		if (/*activeTable*/ ctx[1] === undefined && !("activeTable" in props)) {
    			console_1.warn("<Header> was created without expected prop 'activeTable'");
    		}

    		if (/*headers*/ ctx[12] === undefined && !("headers" in props)) {
    			console_1.warn("<Header> was created without expected prop 'headers'");
    		}

    		if (/*fetchData*/ ctx[14] === undefined && !("fetchData" in props)) {
    			console_1.warn("<Header> was created without expected prop 'fetchData'");
    		}

    		if (/*displayedData*/ ctx[13] === undefined && !("displayedData" in props)) {
    			console_1.warn("<Header> was created without expected prop 'displayedData'");
    		}

    		if (/*currentUser*/ ctx[3] === undefined && !("currentUser" in props)) {
    			console_1.warn("<Header> was created without expected prop 'currentUser'");
    		}

    		if (/*showAPIDocs*/ ctx[2] === undefined && !("showAPIDocs" in props)) {
    			console_1.warn("<Header> was created without expected prop 'showAPIDocs'");
    		}
    	}

    	get dataTables() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataTables(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeTable() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTable(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get headers() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headers(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fetchData() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fetchData(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get displayedData() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set displayedData(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentUser() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentUser(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showAPIDocs() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showAPIDocs(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TypeIcon.svelte generated by Svelte v3.32.3 */

    const file$1 = "src/TypeIcon.svelte";

    // (19:0) {:else}
    function create_else_block$1(ctx) {
    	let t_value = /*type*/ ctx[0][0] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*type*/ 1 && t_value !== (t_value = /*type*/ ctx[0][0] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(19:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (15:26) 
    function create_if_block_4(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z");
    			add_location(path, file$1, 16, 4, 3877);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "class", svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`);
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$1, 15, 2, 3732);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*color*/ 2 && svg_class_value !== (svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`)) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_4.name,
    		type: "if",
    		source: "(15:26) ",
    		ctx
    	});

    	return block;
    }

    // (13:25) 
    function create_if_block_3(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M1 2.5C1 1.67 1.68 1 2.5 1h11c.83 0 1.5.68 1.5 1.5v11c0 .83-.68 1.5-1.5 1.5h-11c-.83 0-1.5-.68-1.5-1.5v-11zm2 0c0 .27.22.5.5.5h3c.28 0 .5-.22.5-.5 0-.27-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5zm6 0c0 .27.22.5.5.5h3c.28 0 .5-.22.5-.5 0-.27-.22-.5-.5-.5h-3c-.28 0-.5.22-.5.5zm-3.8 9.05c-.53 0-.87-.3-.87-.78v-.1c0-.1-.08-.2-.2-.2H3.2c-.1 0-.2.1-.2.2v.1c0 1.15.98 2.06 2.2 2.06 1.2 0 2.17-.9 2.17-2.06 0-.52-.23-1.06-.62-1.36-.05-.04-.05-.1 0-.16.3-.3.52-.76.52-1.23 0-1.1-.93-1.97-2.08-1.97-1.16 0-2.1.88-2.1 1.98v.15c0 .1.08.2.18.2h.95c.1 0 .2-.1.2-.2V8c0-.42.32-.7.76-.7s.75.28.75.7c0 .44-.3.72-.76.72h-.13c-.1 0-.2.1-.2.2v.88c0 .1.1.18.2.18h.12c.5 0 .84.3.84.8 0 .47-.34.77-.85.77zm5.5 1.25c0 .1.1.2.22.2h1.03c.1 0 .2-.1.2-.2V6.2c0-.1-.1-.2-.2-.2H10.8c-.27 0-.44.14-.53.24l-.85.96c-.15.15-.17.28-.17.44v.96c0 .2.23.28.35.16l.9-.84c.07-.06.2-.05.2.08v4.8z");
    			add_location(path, file$1, 13, 93, 2809);
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "class", svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`);
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$1, 13, 2, 2718);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*color*/ 2 && svg_class_value !== (svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`)) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(13:25) ",
    		ctx
    	});

    	return block;
    }

    // (11:28) 
    function create_if_block_2(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M1 4.003A3.002 3.002 0 0 1 4.003 1h7.994A3.002 3.002 0 0 1 15 4.003v7.994A3.002 3.002 0 0 1 11.997 15H4.003A3.002 3.002 0 0 1 1 11.997V4.003zm5.28 7.42c.41.368 1.064.35 1.454-.035l4.67-4.606c.515-.508.52-1.331.012-1.84l.062.063a1.27 1.27 0 0 0-1.817.008l-3.298 3.42a.505.505 0 0 1-.707.014l-1.162-1.08a1.36 1.36 0 0 0-1.872.036l.063-.062A1.225 1.225 0 0 0 3.73 9.13l2.55 2.293z");
    			add_location(path, file$1, 11, 93, 2268);
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "class", svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`);
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$1, 11, 2, 2177);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*color*/ 2 && svg_class_value !== (svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`)) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(11:28) ",
    		ctx
    	});

    	return block;
    }

    // (9:27) 
    function create_if_block_1$1(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M4,10 L4,6.06298828 L2.01023277,6.06298828 C1.44124014,6.06298828 0.979980469,5.60514432 0.979980469,5.03149414 C0.979980469,4.46181566 1.446147,4 2.01023277,4 L4,4 L4,2.04301188 C4,1.50175979 4.43942184,1.06298828 4.98999023,1.06298828 C5.53674674,1.06298828 5.97998047,1.51091265 5.97998047,2.04301188 L5.97998047,4 L10.0200195,4 L10.0200195,2.04301188 C10.0200195,1.50175979 10.4594414,1.06298828 11.0100098,1.06298828 C11.5567663,1.06298828 12,1.51091265 12,2.04301188 L12,4 L13.9605924,4 C14.5295851,4 14.9908447,4.45784396 14.9908447,5.03149414 C14.9908447,5.60117262 14.5246782,6.06298828 13.9605924,6.06298828 L12,6.06298828 L12,10 L13.9605924,10 C14.5295851,10 14.9908447,10.457844 14.9908447,11.0314941 C14.9908447,11.6011726 14.5246782,12.0629883 13.9605924,12.0629883 L12,12.0629883 L12,14.0199764 C12,14.5612285 11.5605782,15 11.0100098,15 C10.4632533,15 10.0200195,14.5520756 10.0200195,14.0199764 L10.0200195,12.0629883 L5.97998047,12.0629883 L5.97998047,14.0199764 C5.97998047,14.5612285 5.54055863,15 4.98999023,15 C4.44323373,15 4,14.5520756 4,14.0199764 L4,12.0629883 L2.01023277,12.0629883 C1.44124014,12.0629883 0.979980469,11.6051443 0.979980469,11.0314941 C0.979980469,10.4618157 1.446147,10 2.01023277,10 L4,10 Z M5.97998047,10 L10.0200195,10 L10.0200195,6.06298828 L5.97998047,6.06298828 L5.97998047,10 Z");
    			add_location(path, file$1, 9, 93, 772);
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "class", svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`);
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$1, 9, 2, 681);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*color*/ 2 && svg_class_value !== (svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`)) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(9:27) ",
    		ctx
    	});

    	return block;
    }

    // (7:0) {#if type == 'String'}
    function create_if_block$1(ctx) {
    	let svg;
    	let path;
    	let svg_class_value;

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "fill-rule", "evenodd");
    			attr_dev(path, "d", "M2.554 12.615L6.628 2.429C6.834 1.916 7.448 1.5 8 1.5c.556 0 1.166.416 1.372.93l4.074 10.185c.306.765-.116 1.385-.944 1.385h-.252a1.1 1.1 0 0 1-.987-.711l-.526-1.578c-.13-.39-.577-.711-.996-.711H6.259c-.43 0-.865.318-.996.711l-.526 1.578c-.13.39-.573.711-.987.711h-.252c-.828 0-1.25-.62-.944-1.385zM6.371 8.07c-.205.513.072.929.638.929h1.982c.557 0 .845-.41.637-.929L8.556 5.393c-.308-.77-.806-.77-1.114 0L6.372 8.07z");
    			add_location(path, file$1, 7, 93, 189);
    			attr_dev(svg, "viewBox", "0 0 16 16");
    			attr_dev(svg, "class", svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`);
    			attr_dev(svg, "fill", "currentColor");
    			add_location(svg, file$1, 7, 2, 98);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*color*/ 2 && svg_class_value !== (svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`)) {
    				attr_dev(svg, "class", svg_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(7:0) {#if type == 'String'}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let span;

    	function select_block_type(ctx, dirty) {
    		if (/*type*/ ctx[0] == "String") return create_if_block$1;
    		if (/*type*/ ctx[0] == "Number") return create_if_block_1$1;
    		if (/*type*/ ctx[0] == "Boolean") return create_if_block_2;
    		if (/*type*/ ctx[0] == "Date") return create_if_block_3;
    		if (/*type*/ ctx[0] == "Mixed") return create_if_block_4;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			if_block.c();
    			attr_dev(span, "class", "mr-3");
    			add_location(span, file$1, 5, 0, 53);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			if_block.m(span, null);
    		},
    		p: function update(ctx, [dirty]) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TypeIcon", slots, []);
    	let { type } = $$props;
    	let { color } = $$props;
    	const writable_props = ["type", "color"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TypeIcon> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    	};

    	$$self.$capture_state = () => ({ type, color });

    	$$self.$inject_state = $$props => {
    		if ("type" in $$props) $$invalidate(0, type = $$props.type);
    		if ("color" in $$props) $$invalidate(1, color = $$props.color);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [type, color];
    }

    class TypeIcon extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { type: 0, color: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TypeIcon",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*type*/ ctx[0] === undefined && !("type" in props)) {
    			console.warn("<TypeIcon> was created without expected prop 'type'");
    		}

    		if (/*color*/ ctx[1] === undefined && !("color" in props)) {
    			console.warn("<TypeIcon> was created without expected prop 'color'");
    		}
    	}

    	get type() {
    		throw new Error("<TypeIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<TypeIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<TypeIcon>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<TypeIcon>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TableHeader.svelte generated by Svelte v3.32.3 */
    const file$2 = "src/TableHeader.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[29] = list[i];
    	return child_ctx;
    }

    // (166:12) {:else}
    function create_else_block_1(ctx) {
    	let span;
    	let t0_value = /*header*/ ctx[29].name + "";
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let if_block = /*header*/ ctx[29].owner == /*currentUser*/ ctx[3].username && create_if_block_2$1(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span, "class", "text-gray-900 text-base font-medium flex-grow");
    			add_location(span, file$2, 166, 14, 5031);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*headers*/ 1 && t0_value !== (t0_value = /*header*/ ctx[29].name + "")) set_data_dev(t0, t0_value);

    			if (/*header*/ ctx[29].owner == /*currentUser*/ ctx[3].username) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2$1(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(166:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (161:12) {#if editFieldName == header.name}
    function create_if_block_1$2(ctx) {
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let t;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[16](/*header*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(input, "id", input_id_value = /*header*/ ctx[29].name.replace(/ /g, "-"));
    			attr_dev(input, "class", "focus:outline-none apperance-none bg-gray-200 flex-grow");
    			input.value = input_value_value = /*header*/ ctx[29].name;
    			add_location(input, file$2, 161, 14, 4521);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M5 13l4 4L19 7");
    			add_location(path, file$2, 163, 16, 4884);
    			attr_dev(svg, "class", "cursor-pointer h-3 w-3 text-gray-900 ml-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$2, 162, 14, 4665);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*headers*/ 1 && input_id_value !== (input_id_value = /*header*/ ctx[29].name.replace(/ /g, "-"))) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty[0] & /*headers*/ 1 && input_value_value !== (input_value_value = /*header*/ ctx[29].name) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(161:12) {#if editFieldName == header.name}",
    		ctx
    	});

    	return block;
    }

    // (168:14) {#if header.owner == currentUser.username}
    function create_if_block_2$1(ctx) {
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[17](/*header*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z");
    			add_location(path, file$2, 169, 18, 5388);
    			attr_dev(svg, "class", "cursor-pointer h-3 w-3 text-gray-900 ml-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$2, 168, 16, 5185);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", click_handler_1, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(168:14) {#if header.owner == currentUser.username}",
    		ctx
    	});

    	return block;
    }

    // (193:16) {:else}
    function create_else_block$2(ctx) {
    	let span;
    	let t_value = (/*header*/ ctx[29].default || "Set Default") + "";
    	let t;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t = text(t_value);
    			add_location(span, file$2, 193, 18, 8036);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*headers*/ 1 && t_value !== (t_value = (/*header*/ ctx[29].default || "Set Default") + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(193:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (188:16) {#if settingDefault}
    function create_if_block$2(ctx) {
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let t;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[19](/*header*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(input, "id", input_id_value = `default-${/*header*/ ctx[29].name.replace(/ /g, "-")}`);
    			attr_dev(input, "class", "focus:outline-none apperance-none bg-white rounded-sm flex-grow");
    			input.value = input_value_value = /*header*/ ctx[29].default;
    			add_location(input, file$2, 188, 18, 7484);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M5 13l4 4L19 7");
    			add_location(path, file$2, 190, 20, 7877);
    			attr_dev(svg, "class", "cursor-pointer h-3 w-3 text-gray-900 ml-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$2, 189, 18, 7656);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			insert_dev(target, svg, anchor);
    			append_dev(svg, path);

    			if (!mounted) {
    				dispose = listen_dev(svg, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*headers*/ 1 && input_id_value !== (input_id_value = `default-${/*header*/ ctx[29].name.replace(/ /g, "-")}`)) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty[0] & /*headers*/ 1 && input_value_value !== (input_value_value = /*header*/ ctx[29].default) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(svg);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(188:16) {#if settingDefault}",
    		ctx
    	});

    	return block;
    }

    // (157:6) {#each headers as header}
    function create_each_block$1(ctx) {
    	let th;
    	let div0;
    	let typeicon0;
    	let t0;
    	let t1;
    	let div1;
    	let ul;
    	let li0;
    	let svg0;
    	let path0;
    	let t2;
    	let t3;
    	let li1;
    	let svg1;
    	let path1;
    	let path2;
    	let t4;
    	let li1_class_value;
    	let t5;
    	let li2;
    	let typeicon1;
    	let t6;
    	let li2_class_value;
    	let t7;
    	let li3;
    	let typeicon2;
    	let t8;
    	let li3_class_value;
    	let t9;
    	let li4;
    	let typeicon3;
    	let t10;
    	let li4_class_value;
    	let t11;
    	let li5;
    	let typeicon4;
    	let t12;
    	let li5_class_value;
    	let t13;
    	let li6;
    	let typeicon5;
    	let t14;
    	let li6_class_value;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	typeicon0 = new TypeIcon({
    			props: { type: /*header*/ ctx[29].type },
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (/*editFieldName*/ ctx[4] == /*header*/ ctx[29].name) return create_if_block_1$2;
    		return create_else_block_1;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block0 = current_block_type(ctx);

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[18](/*header*/ ctx[29]);
    	}

    	function select_block_type_1(ctx, dirty) {
    		if (/*settingDefault*/ ctx[6]) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type_1 = select_block_type_1(ctx);
    	let if_block1 = current_block_type_1(ctx);

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[20](/*header*/ ctx[29]);
    	}

    	typeicon1 = new TypeIcon({
    			props: {
    				type: "String",
    				color: /*header*/ ctx[29].type == "String"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[21](/*header*/ ctx[29]);
    	}

    	typeicon2 = new TypeIcon({
    			props: {
    				type: "Number",
    				color: /*header*/ ctx[29].type == "Number"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_6() {
    		return /*click_handler_6*/ ctx[22](/*header*/ ctx[29]);
    	}

    	typeicon3 = new TypeIcon({
    			props: {
    				type: "Boolean",
    				color: /*header*/ ctx[29].type == "Boolean"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_7() {
    		return /*click_handler_7*/ ctx[23](/*header*/ ctx[29]);
    	}

    	typeicon4 = new TypeIcon({
    			props: {
    				type: "Date",
    				color: /*header*/ ctx[29].type == "Date"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_8() {
    		return /*click_handler_8*/ ctx[24](/*header*/ ctx[29]);
    	}

    	typeicon5 = new TypeIcon({
    			props: {
    				type: "Mixed",
    				color: /*header*/ ctx[29].type == "Mixed"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_9() {
    		return /*click_handler_9*/ ctx[25](/*header*/ ctx[29]);
    	}

    	const block = {
    		c: function create() {
    			th = element("th");
    			div0 = element("div");
    			create_component(typeicon0.$$.fragment);
    			t0 = space();
    			if_block0.c();
    			t1 = space();
    			div1 = element("div");
    			ul = element("ul");
    			li0 = element("li");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t2 = text("\n                Edit Field Name");
    			t3 = space();
    			li1 = element("li");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			t4 = space();
    			if_block1.c();
    			t5 = space();
    			li2 = element("li");
    			create_component(typeicon1.$$.fragment);
    			t6 = text("\n                String");
    			t7 = space();
    			li3 = element("li");
    			create_component(typeicon2.$$.fragment);
    			t8 = text("\n                Number");
    			t9 = space();
    			li4 = element("li");
    			create_component(typeicon3.$$.fragment);
    			t10 = text("\n                Boolean");
    			t11 = space();
    			li5 = element("li");
    			create_component(typeicon4.$$.fragment);
    			t12 = text("\n                Date");
    			t13 = space();
    			li6 = element("li");
    			create_component(typeicon5.$$.fragment);
    			t14 = text("\n                Mixed");
    			attr_dev(div0, "class", "flex items-center");
    			add_location(div0, file$2, 158, 10, 4385);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z");
    			add_location(path0, file$2, 178, 16, 6116);
    			attr_dev(svg0, "class", "text-white h-4 w-4 mr-3");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file$2, 177, 14, 5973);
    			attr_dev(li0, "class", "rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center text-white text-sm font-medium");
    			add_location(li0, file$2, 176, 14, 5801);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z");
    			add_location(path1, file$2, 184, 16, 6721);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M15 12a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path2, file$2, 185, 16, 7298);
    			attr_dev(svg1, "class", "h-4 w-4 mr-3");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$2, 183, 14, 6589);

    			attr_dev(li1, "class", li1_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].default
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li1, file$2, 182, 14, 6377);

    			attr_dev(li2, "class", li2_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "String"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li2, file$2, 196, 14, 8139);

    			attr_dev(li3, "class", li3_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Number"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li3, file$2, 200, 14, 8527);

    			attr_dev(li4, "class", li4_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Boolean"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li4, file$2, 204, 14, 8915);

    			attr_dev(li5, "class", li5_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Date"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li5, file$2, 208, 14, 9308);

    			attr_dev(li6, "class", li6_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Mixed"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li6, file$2, 212, 14, 9686);
    			add_location(ul, file$2, 175, 12, 5782);

    			attr_dev(div1, "class", div1_class_value = `flex flex-col absolute z-10 mt-4 p-2 bg-gray-700 rounded-md ${/*fieldEdit*/ ctx[5] == /*header*/ ctx[29].name
			? ""
			: "hidden"}`);

    			add_location(div1, file$2, 174, 10, 5650);
    			attr_dev(th, "class", "p-2 bg-gray-200 border-l border-r border-gray-400 text-left");
    			add_location(th, file$2, 157, 8, 4302);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, div0);
    			mount_component(typeicon0, div0, null);
    			append_dev(div0, t0);
    			if_block0.m(div0, null);
    			append_dev(th, t1);
    			append_dev(th, div1);
    			append_dev(div1, ul);
    			append_dev(ul, li0);
    			append_dev(li0, svg0);
    			append_dev(svg0, path0);
    			append_dev(li0, t2);
    			append_dev(ul, t3);
    			append_dev(ul, li1);
    			append_dev(li1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);
    			append_dev(li1, t4);
    			if_block1.m(li1, null);
    			append_dev(ul, t5);
    			append_dev(ul, li2);
    			mount_component(typeicon1, li2, null);
    			append_dev(li2, t6);
    			append_dev(ul, t7);
    			append_dev(ul, li3);
    			mount_component(typeicon2, li3, null);
    			append_dev(li3, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li4);
    			mount_component(typeicon3, li4, null);
    			append_dev(li4, t10);
    			append_dev(ul, t11);
    			append_dev(ul, li5);
    			mount_component(typeicon4, li5, null);
    			append_dev(li5, t12);
    			append_dev(ul, t13);
    			append_dev(ul, li6);
    			mount_component(typeicon5, li6, null);
    			append_dev(li6, t14);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(li0, "click", click_handler_2, false, false, false),
    					listen_dev(li1, "click", click_handler_4, false, false, false),
    					listen_dev(li2, "click", click_handler_5, false, false, false),
    					listen_dev(li3, "click", click_handler_6, false, false, false),
    					listen_dev(li4, "click", click_handler_7, false, false, false),
    					listen_dev(li5, "click", click_handler_8, false, false, false),
    					listen_dev(li6, "click", click_handler_9, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const typeicon0_changes = {};
    			if (dirty[0] & /*headers*/ 1) typeicon0_changes.type = /*header*/ ctx[29].type;
    			typeicon0.$set(typeicon0_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block0) {
    				if_block0.p(ctx, dirty);
    			} else {
    				if_block0.d(1);
    				if_block0 = current_block_type(ctx);

    				if (if_block0) {
    					if_block0.c();
    					if_block0.m(div0, null);
    				}
    			}

    			if (current_block_type_1 === (current_block_type_1 = select_block_type_1(ctx)) && if_block1) {
    				if_block1.p(ctx, dirty);
    			} else {
    				if_block1.d(1);
    				if_block1 = current_block_type_1(ctx);

    				if (if_block1) {
    					if_block1.c();
    					if_block1.m(li1, null);
    				}
    			}

    			if (!current || dirty[0] & /*headers*/ 1 && li1_class_value !== (li1_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].default
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li1, "class", li1_class_value);
    			}

    			const typeicon1_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon1_changes.color = /*header*/ ctx[29].type == "String"
    			? "text-white"
    			: "text-gray-400";

    			typeicon1.$set(typeicon1_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li2_class_value !== (li2_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "String"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li2, "class", li2_class_value);
    			}

    			const typeicon2_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon2_changes.color = /*header*/ ctx[29].type == "Number"
    			? "text-white"
    			: "text-gray-400";

    			typeicon2.$set(typeicon2_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li3_class_value !== (li3_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Number"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li3, "class", li3_class_value);
    			}

    			const typeicon3_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon3_changes.color = /*header*/ ctx[29].type == "Boolean"
    			? "text-white"
    			: "text-gray-400";

    			typeicon3.$set(typeicon3_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li4_class_value !== (li4_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Boolean"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li4, "class", li4_class_value);
    			}

    			const typeicon4_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon4_changes.color = /*header*/ ctx[29].type == "Date"
    			? "text-white"
    			: "text-gray-400";

    			typeicon4.$set(typeicon4_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li5_class_value !== (li5_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Date"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li5, "class", li5_class_value);
    			}

    			const typeicon5_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon5_changes.color = /*header*/ ctx[29].type == "Mixed"
    			? "text-white"
    			: "text-gray-400";

    			typeicon5.$set(typeicon5_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li6_class_value !== (li6_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[29].type == "Mixed"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li6, "class", li6_class_value);
    			}

    			if (!current || dirty[0] & /*fieldEdit, headers*/ 33 && div1_class_value !== (div1_class_value = `flex flex-col absolute z-10 mt-4 p-2 bg-gray-700 rounded-md ${/*fieldEdit*/ ctx[5] == /*header*/ ctx[29].name
			? ""
			: "hidden"}`)) {
    				attr_dev(div1, "class", div1_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(typeicon0.$$.fragment, local);
    			transition_in(typeicon1.$$.fragment, local);
    			transition_in(typeicon2.$$.fragment, local);
    			transition_in(typeicon3.$$.fragment, local);
    			transition_in(typeicon4.$$.fragment, local);
    			transition_in(typeicon5.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(typeicon0.$$.fragment, local);
    			transition_out(typeicon1.$$.fragment, local);
    			transition_out(typeicon2.$$.fragment, local);
    			transition_out(typeicon3.$$.fragment, local);
    			transition_out(typeicon4.$$.fragment, local);
    			transition_out(typeicon5.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			destroy_component(typeicon0);
    			if_block0.d();
    			if_block1.d();
    			destroy_component(typeicon1);
    			destroy_component(typeicon2);
    			destroy_component(typeicon3);
    			destroy_component(typeicon4);
    			destroy_component(typeicon5);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(157:6) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let thead;
    	let tr;
    	let th0;
    	let t0;
    	let th1;
    	let span0;
    	let t2;
    	let t3;
    	let th2;
    	let span1;
    	let th2_class_value;
    	let current;
    	let mounted;
    	let dispose;
    	let each_value = /*headers*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			thead = element("thead");
    			tr = element("tr");
    			th0 = element("th");
    			t0 = space();
    			th1 = element("th");
    			span0 = element("span");
    			span0.textContent = "id";
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			th2 = element("th");
    			span1 = element("span");
    			span1.textContent = "+";
    			attr_dev(th0, "class", "p-2 bg-gray-200 border-l border-r border-gray-400 text-left bg-gray-200");
    			add_location(th0, file$2, 151, 4, 4002);
    			attr_dev(span0, "class", "text-gray-900 text-base font-medium");
    			add_location(span0, file$2, 154, 6, 4192);
    			attr_dev(th1, "class", "p-2 bg-gray-200 border-l border-r border-gray-400 text-left bg-gray-200");
    			add_location(th1, file$2, 153, 4, 4101);
    			attr_dev(span1, "class", "text-gray-900 text-base font-medium px-4");
    			add_location(span1, file$2, 221, 8, 10411);

    			attr_dev(th2, "class", th2_class_value = `${/*headers*/ ctx[0][0].owner == /*currentUser*/ ctx[3].username
			? ""
			: "hidden"} p-2 bg-gray-200 border-l border-r border-gray-400 text-center cursor-pointer`);

    			add_location(th2, file$2, 220, 6, 10124);
    			attr_dev(tr, "class", "");
    			add_location(tr, file$2, 150, 2, 3984);
    			attr_dev(thead, "class", "justify-between sticky top-0 border-b-4 border-gray-300");
    			add_location(thead, file$2, 149, 0, 3910);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, thead, anchor);
    			append_dev(thead, tr);
    			append_dev(tr, th0);
    			append_dev(tr, t0);
    			append_dev(tr, th1);
    			append_dev(th1, span0);
    			append_dev(tr, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t3);
    			append_dev(tr, th2);
    			append_dev(th2, span1);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(th2, "mouseover", /*mouseover_handler*/ ctx[26], false, false, false),
    					listen_dev(th2, "mouseout", /*mouseout_handler*/ ctx[27], false, false, false),
    					listen_dev(th2, "click", /*click_handler_10*/ ctx[28], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*fieldEdit, headers, changeType, settingDefault, changeDefault, editThisFieldName, changeFieldName, editFieldName, editField, currentUser*/ 4089) {
    				each_value = /*headers*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(tr, t3);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}

    			if (!current || dirty[0] & /*headers, currentUser*/ 9 && th2_class_value !== (th2_class_value = `${/*headers*/ ctx[0][0].owner == /*currentUser*/ ctx[3].username
			? ""
			: "hidden"} p-2 bg-gray-200 border-l border-r border-gray-400 text-center cursor-pointer`)) {
    				attr_dev(th2, "class", th2_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(thead);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TableHeader", slots, []);
    	let { headers } = $$props;
    	let { activeTable } = $$props;
    	let { hoverNewField } = $$props;
    	let { dataTables } = $$props;
    	let { fetchData } = $$props;
    	let { displayedData } = $$props;
    	let { currentUser } = $$props;
    	let editFieldName;
    	let fieldEdit;
    	let settingDefault;

    	const editField = field => {
    		if (fieldEdit == field) {
    			$$invalidate(5, fieldEdit = "");
    		} else {
    			$$invalidate(5, fieldEdit = field);
    		}
    	};

    	const editThisFieldName = field => {
    		$$invalidate(4, editFieldName = field);
    		let id = field.replace(/ /g, "-");

    		setTimeout(
    			() => {
    				document.querySelector(`#${id}`).focus();
    			},
    			10
    		);
    	};

    	const changeFieldName = async (field, id) => {
    		let domId = field.replace(/ /g, "-");
    		let name = document.querySelector(`#${domId}`).value;

    		await fetch(`/api/database/${activeTable.replace(/ /g, "-")}/${id}`, {
    			method: "PUT",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({ name })
    		});

    		$$invalidate(4, editFieldName = "");
    		const dataResponse = await fetch(`api/database`);
    		let data = await dataResponse.json();
    		$$invalidate(13, dataTables = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == activeTable)[0];

    		if (tableHeaders) {
    			$$invalidate(0, headers = tableHeaders.props);

    			$$invalidate(0, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(0, headers = []);
    		}

    		const tableDataResposne = await fetchData(activeTable);
    		data = await tableDataResposne.json();
    		$$invalidate(14, displayedData = data);
    	};

    	const changeDefault = async (field, id) => {
    		let domId = field.replace(/ /g, "-");
    		let defaultValue = document.querySelector(`#default-${domId}`).value;

    		await fetch(`/api/database/${activeTable.replace(/ /g, "-")}/${id}`, {
    			method: "PUT",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({ default: defaultValue })
    		});

    		$$invalidate(6, settingDefault = "");
    		$$invalidate(5, fieldEdit = "");
    		const dataResponse = await fetch(`api/database`);
    		let data = await dataResponse.json();
    		$$invalidate(13, dataTables = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == activeTable)[0];

    		if (tableHeaders) {
    			$$invalidate(0, headers = tableHeaders.props);

    			$$invalidate(0, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(0, headers = []);
    		}

    		const tableDataResposne = await fetchData(activeTable);
    		data = await tableDataResposne.json();
    		$$invalidate(14, displayedData = data);
    	};

    	const changeType = async (field, id, type) => {
    		await fetch(`/api/database/${activeTable.replace(/ /g, "-")}/${id}`, {
    			method: "PUT",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({ type })
    		});

    		$$invalidate(5, fieldEdit = "");
    		const dataResponse = await fetch(`api/database`);
    		let data = await dataResponse.json();
    		$$invalidate(13, dataTables = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == activeTable)[0];

    		if (tableHeaders) {
    			$$invalidate(0, headers = tableHeaders.props);

    			$$invalidate(0, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(0, headers = []);
    		}

    		const tableDataResposne = await fetchData(activeTable);
    		data = await tableDataResposne.json();
    		$$invalidate(14, displayedData = data);
    	};

    	const newColHeader = async table => {
    		const id = "column" + Math.floor(Math.random() * Math.floor(100));

    		await fetch(`/api/database/${table}`, {
    			method: "PUT",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({ props: { name: id, type: "String" } })
    		});

    		const dataResponse = await fetch(`api/database`);
    		let data = await dataResponse.json();
    		$$invalidate(13, dataTables = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == table)[0];

    		if (tableHeaders) {
    			$$invalidate(0, headers = tableHeaders.props);

    			$$invalidate(0, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(0, headers = []);
    		}
    	};

    	const writable_props = [
    		"headers",
    		"activeTable",
    		"hoverNewField",
    		"dataTables",
    		"fetchData",
    		"displayedData",
    		"currentUser"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TableHeader> was created with unknown prop '${key}'`);
    	});

    	const click_handler = header => changeFieldName(header.name, header._id);
    	const click_handler_1 = header => editField(header.name);
    	const click_handler_2 = header => editThisFieldName(header.name);
    	const click_handler_3 = header => changeDefault(header.name, header._id);
    	const click_handler_4 = header => $$invalidate(6, settingDefault = header.name);
    	const click_handler_5 = header => changeType(header.name, header._id, "String");
    	const click_handler_6 = header => changeType(header.name, header._id, "Number");
    	const click_handler_7 = header => changeType(header.name, header._id, "Boolean");
    	const click_handler_8 = header => changeType(header.name, header._id, "Date");
    	const click_handler_9 = header => changeType(header.name, header._id, "Mixed");
    	const mouseover_handler = () => $$invalidate(1, hoverNewField = true);
    	const mouseout_handler = () => $$invalidate(1, hoverNewField = false);
    	const click_handler_10 = () => newColHeader(activeTable);

    	$$self.$$set = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(2, activeTable = $$props.activeTable);
    		if ("hoverNewField" in $$props) $$invalidate(1, hoverNewField = $$props.hoverNewField);
    		if ("dataTables" in $$props) $$invalidate(13, dataTables = $$props.dataTables);
    		if ("fetchData" in $$props) $$invalidate(15, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(14, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(3, currentUser = $$props.currentUser);
    	};

    	$$self.$capture_state = () => ({
    		TypeIcon,
    		headers,
    		activeTable,
    		hoverNewField,
    		dataTables,
    		fetchData,
    		displayedData,
    		currentUser,
    		editFieldName,
    		fieldEdit,
    		settingDefault,
    		editField,
    		editThisFieldName,
    		changeFieldName,
    		changeDefault,
    		changeType,
    		newColHeader
    	});

    	$$self.$inject_state = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(2, activeTable = $$props.activeTable);
    		if ("hoverNewField" in $$props) $$invalidate(1, hoverNewField = $$props.hoverNewField);
    		if ("dataTables" in $$props) $$invalidate(13, dataTables = $$props.dataTables);
    		if ("fetchData" in $$props) $$invalidate(15, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(14, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(3, currentUser = $$props.currentUser);
    		if ("editFieldName" in $$props) $$invalidate(4, editFieldName = $$props.editFieldName);
    		if ("fieldEdit" in $$props) $$invalidate(5, fieldEdit = $$props.fieldEdit);
    		if ("settingDefault" in $$props) $$invalidate(6, settingDefault = $$props.settingDefault);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		headers,
    		hoverNewField,
    		activeTable,
    		currentUser,
    		editFieldName,
    		fieldEdit,
    		settingDefault,
    		editField,
    		editThisFieldName,
    		changeFieldName,
    		changeDefault,
    		changeType,
    		newColHeader,
    		dataTables,
    		displayedData,
    		fetchData,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6,
    		click_handler_7,
    		click_handler_8,
    		click_handler_9,
    		mouseover_handler,
    		mouseout_handler,
    		click_handler_10
    	];
    }

    class TableHeader extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$2,
    			create_fragment$2,
    			safe_not_equal,
    			{
    				headers: 0,
    				activeTable: 2,
    				hoverNewField: 1,
    				dataTables: 13,
    				fetchData: 15,
    				displayedData: 14,
    				currentUser: 3
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TableHeader",
    			options,
    			id: create_fragment$2.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*headers*/ ctx[0] === undefined && !("headers" in props)) {
    			console.warn("<TableHeader> was created without expected prop 'headers'");
    		}

    		if (/*activeTable*/ ctx[2] === undefined && !("activeTable" in props)) {
    			console.warn("<TableHeader> was created without expected prop 'activeTable'");
    		}

    		if (/*hoverNewField*/ ctx[1] === undefined && !("hoverNewField" in props)) {
    			console.warn("<TableHeader> was created without expected prop 'hoverNewField'");
    		}

    		if (/*dataTables*/ ctx[13] === undefined && !("dataTables" in props)) {
    			console.warn("<TableHeader> was created without expected prop 'dataTables'");
    		}

    		if (/*fetchData*/ ctx[15] === undefined && !("fetchData" in props)) {
    			console.warn("<TableHeader> was created without expected prop 'fetchData'");
    		}

    		if (/*displayedData*/ ctx[14] === undefined && !("displayedData" in props)) {
    			console.warn("<TableHeader> was created without expected prop 'displayedData'");
    		}

    		if (/*currentUser*/ ctx[3] === undefined && !("currentUser" in props)) {
    			console.warn("<TableHeader> was created without expected prop 'currentUser'");
    		}
    	}

    	get headers() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headers(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeTable() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTable(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get hoverNewField() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set hoverNewField(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dataTables() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataTables(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fetchData() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fetchData(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get displayedData() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set displayedData(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentUser() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentUser(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const preserveCamelCase = (string, locale) => {
    	let isLastCharLower = false;
    	let isLastCharUpper = false;
    	let isLastLastCharUpper = false;

    	for (let i = 0; i < string.length; i++) {
    		const character = string[i];

    		if (isLastCharLower && /[\p{Lu}]/u.test(character)) {
    			string = string.slice(0, i) + '-' + string.slice(i);
    			isLastCharLower = false;
    			isLastLastCharUpper = isLastCharUpper;
    			isLastCharUpper = true;
    			i++;
    		} else if (isLastCharUpper && isLastLastCharUpper && /[\p{Ll}]/u.test(character)) {
    			string = string.slice(0, i - 1) + '-' + string.slice(i - 1);
    			isLastLastCharUpper = isLastCharUpper;
    			isLastCharUpper = false;
    			isLastCharLower = true;
    		} else {
    			isLastCharLower = character.toLocaleLowerCase(locale) === character && character.toLocaleUpperCase(locale) !== character;
    			isLastLastCharUpper = isLastCharUpper;
    			isLastCharUpper = character.toLocaleUpperCase(locale) === character && character.toLocaleLowerCase(locale) !== character;
    		}
    	}

    	return string;
    };

    const preserveConsecutiveUppercase = input => {
    	return input.replace(/^[\p{Lu}](?![\p{Lu}])/gu, m1 => m1.toLowerCase());
    };

    const postProcess = (input, options) => {
    	return input.replace(/[_.\- ]+([\p{Alpha}\p{N}_]|$)/gu, (_, p1) => p1.toLocaleUpperCase(options.locale))
    		.replace(/\d+([\p{Alpha}\p{N}_]|$)/gu, m => m.toLocaleUpperCase(options.locale));
    };

    const camelCase = (input, options) => {
    	if (!(typeof input === 'string' || Array.isArray(input))) {
    		throw new TypeError('Expected the input to be `string | string[]`');
    	}

    	options = {
    		pascalCase: false,
    		preserveConsecutiveUppercase: false,
    		...options
    	};

    	if (Array.isArray(input)) {
    		input = input.map(x => x.trim())
    			.filter(x => x.length)
    			.join('-');
    	} else {
    		input = input.trim();
    	}

    	if (input.length === 0) {
    		return '';
    	}

    	if (input.length === 1) {
    		return options.pascalCase ? input.toLocaleUpperCase(options.locale) : input.toLocaleLowerCase(options.locale);
    	}

    	const hasUpperCase = input !== input.toLocaleLowerCase(options.locale);

    	if (hasUpperCase) {
    		input = preserveCamelCase(input, options.locale);
    	}

    	input = input.replace(/^[_.\- ]+/, '');

    	if (options.preserveConsecutiveUppercase) {
    		input = preserveConsecutiveUppercase(input);
    	} else {
    		input = input.toLocaleLowerCase();
    	}

    	if (options.pascalCase) {
    		input = input.charAt(0).toLocaleUpperCase(options.locale) + input.slice(1);
    	}

    	return postProcess(input, options);
    };

    var camelcase = camelCase;
    // TODO: Remove this for the next major release
    var _default = camelCase;
    camelcase.default = _default;

    /* src/LoggedIn.svelte generated by Svelte v3.32.3 */

    const { console: console_1$1 } = globals;
    const file$3 = "src/LoggedIn.svelte";

    function create_fragment$3(ctx) {
    	let div2;
    	let div1;
    	let input0;
    	let t0;
    	let input1;
    	let t1;
    	let div0;
    	let div2_class_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			input0 = element("input");
    			t0 = space();
    			input1 = element("input");
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Log In";
    			attr_dev(input0, "id", "username");
    			attr_dev(input0, "class", " bg-green-200 apperance-none border-green-600 border rounded-lg focus:outline-none ring-green-600 text-green-600 ring-4 ring-opacity-0 focus:ring-opacity-80 p-2");
    			attr_dev(input0, "placeholder", "username");
    			attr_dev(input0, "type", "text");
    			add_location(input0, file$3, 38, 4, 1063);
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "class", "bg-green-200 apperance-none border-green-600 border rounded-lg focus:outline-none ring-green-600 text-green-600 ring-4 ring-opacity-0 focus:ring-opacity-80 p-2");
    			attr_dev(input1, "placeholder", "password");
    			attr_dev(input1, "type", "password");
    			add_location(input1, file$3, 39, 4, 1295);
    			attr_dev(div0, "class", "bg-green-600 border-4 border-green-600 hover:bg-green-200 hover:text-green-600 text-white text-xl font-semibold p-2 rounded-lg w-full flex items-center justify-center cursor-pointer");
    			add_location(div0, file$3, 40, 4, 1530);
    			attr_dev(div1, "class", "flex-col space-y-6 border-4 border-green-600 rounded-lg bg-green-200 p-12 flex items-center justify-center");
    			add_location(div1, file$3, 37, 2, 938);
    			attr_dev(div2, "class", div2_class_value = `${/*loggedin*/ ctx[0] ? "hidden" : ""} z-30 fixed w-screen h-screen bg-green-200 flex items-center justify-center`);
    			add_location(div2, file$3, 36, 0, 817);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, input0);
    			append_dev(div1, t0);
    			append_dev(div1, input1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*login*/ ctx[1], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*loggedin*/ 1 && div2_class_value !== (div2_class_value = `${/*loggedin*/ ctx[0] ? "hidden" : ""} z-30 fixed w-screen h-screen bg-green-200 flex items-center justify-center`)) {
    				attr_dev(div2, "class", div2_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("LoggedIn", slots, []);
    	let { loggedin } = $$props;
    	let { currentUser } = $$props;
    	let { checkUser } = $$props;
    	let { loadData } = $$props;

    	const login = async () => {
    		let token = await fetch(`/api/users/login`, {
    			method: "POST",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({
    				username: document.querySelector("#username").value,
    				password: document.querySelector("#password").value
    			})
    		});

    		token = await token.json();
    		console.log(token);

    		if (token.message) {
    			console.log(token.message);
    			return;
    		}

    		window.sessionStorage.setItem("api_key", token.token);
    		let user = await checkUser();
    		user = await user.json();
    		console.log(user);

    		if (user.username) {
    			$$invalidate(2, currentUser = user);
    			$$invalidate(0, loggedin = true);
    			loadData();
    		}
    	};

    	const writable_props = ["loggedin", "currentUser", "checkUser", "loadData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<LoggedIn> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("loggedin" in $$props) $$invalidate(0, loggedin = $$props.loggedin);
    		if ("currentUser" in $$props) $$invalidate(2, currentUser = $$props.currentUser);
    		if ("checkUser" in $$props) $$invalidate(3, checkUser = $$props.checkUser);
    		if ("loadData" in $$props) $$invalidate(4, loadData = $$props.loadData);
    	};

    	$$self.$capture_state = () => ({
    		loggedin,
    		currentUser,
    		checkUser,
    		loadData,
    		login
    	});

    	$$self.$inject_state = $$props => {
    		if ("loggedin" in $$props) $$invalidate(0, loggedin = $$props.loggedin);
    		if ("currentUser" in $$props) $$invalidate(2, currentUser = $$props.currentUser);
    		if ("checkUser" in $$props) $$invalidate(3, checkUser = $$props.checkUser);
    		if ("loadData" in $$props) $$invalidate(4, loadData = $$props.loadData);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [loggedin, login, currentUser, checkUser, loadData];
    }

    class LoggedIn extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {
    			loggedin: 0,
    			currentUser: 2,
    			checkUser: 3,
    			loadData: 4
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "LoggedIn",
    			options,
    			id: create_fragment$3.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*loggedin*/ ctx[0] === undefined && !("loggedin" in props)) {
    			console_1$1.warn("<LoggedIn> was created without expected prop 'loggedin'");
    		}

    		if (/*currentUser*/ ctx[2] === undefined && !("currentUser" in props)) {
    			console_1$1.warn("<LoggedIn> was created without expected prop 'currentUser'");
    		}

    		if (/*checkUser*/ ctx[3] === undefined && !("checkUser" in props)) {
    			console_1$1.warn("<LoggedIn> was created without expected prop 'checkUser'");
    		}

    		if (/*loadData*/ ctx[4] === undefined && !("loadData" in props)) {
    			console_1$1.warn("<LoggedIn> was created without expected prop 'loadData'");
    		}
    	}

    	get loggedin() {
    		throw new Error("<LoggedIn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loggedin(value) {
    		throw new Error("<LoggedIn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentUser() {
    		throw new Error("<LoggedIn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentUser(value) {
    		throw new Error("<LoggedIn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get checkUser() {
    		throw new Error("<LoggedIn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set checkUser(value) {
    		throw new Error("<LoggedIn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loadData() {
    		throw new Error("<LoggedIn>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loadData(value) {
    		throw new Error("<LoggedIn>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/ApiDocs.svelte generated by Svelte v3.32.3 */
    const file$4 = "src/ApiDocs.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (19:62) {#if i != (headers.length - 1)}
    function create_if_block_1$3(ctx) {
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			t = text(",");
    			br = element("br");
    			add_location(br, file$4, 18, 94, 1259);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(19:62) {#if i != (headers.length - 1)}",
    		ctx
    	});

    	return block;
    }

    // (18:6) {#each headers as header, i}
    function create_each_block_1(ctx) {
    	let t0;
    	let t1_value = camelcase(/*header*/ ctx[3].name) + "";
    	let t1;
    	let t2;
    	let t3_value = /*header*/ ctx[3].type + "";
    	let t3;
    	let t4;
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[5] != /*headers*/ ctx[2].length - 1 && create_if_block_1$3(ctx);

    	const block = {
    		c: function create() {
    			t0 = text("    ");
    			t1 = text(t1_value);
    			t2 = text(": ");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*headers*/ 4 && t1_value !== (t1_value = camelcase(/*header*/ ctx[3].name) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*headers*/ 4 && t3_value !== (t3_value = /*header*/ ctx[3].type + "")) set_data_dev(t3, t3_value);

    			if (/*i*/ ctx[5] != /*headers*/ ctx[2].length - 1) {
    				if (if_block) ; else {
    					if_block = create_if_block_1$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(18:6) {#each headers as header, i}",
    		ctx
    	});

    	return block;
    }

    // (28:62) {#if i != (headers.length - 1)}
    function create_if_block$3(ctx) {
    	let t;
    	let br;

    	const block = {
    		c: function create() {
    			t = text(",");
    			br = element("br");
    			add_location(br, file$4, 27, 94, 1651);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    			insert_dev(target, br, anchor);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    			if (detaching) detach_dev(br);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(28:62) {#if i != (headers.length - 1)}",
    		ctx
    	});

    	return block;
    }

    // (27:6) {#each headers as header, i}
    function create_each_block$2(ctx) {
    	let t0;
    	let t1_value = camelcase(/*header*/ ctx[3].name) + "";
    	let t1;
    	let t2;
    	let t3_value = /*header*/ ctx[3].type + "";
    	let t3;
    	let t4;
    	let if_block_anchor;
    	let if_block = /*i*/ ctx[5] != /*headers*/ ctx[2].length - 1 && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			t0 = text("    ");
    			t1 = text(t1_value);
    			t2 = text(": ");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, t4, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*headers*/ 4 && t1_value !== (t1_value = camelcase(/*header*/ ctx[3].name) + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*headers*/ 4 && t3_value !== (t3_value = /*header*/ ctx[3].type + "")) set_data_dev(t3, t3_value);

    			if (/*i*/ ctx[5] != /*headers*/ ctx[2].length - 1) {
    				if (if_block) ; else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(t4);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(27:6) {#each headers as header, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div;
    	let p0;
    	let t0;

    	let t1_value = (/*activeTable*/ ctx[1]
    	? /*activeTable*/ ctx[1][0].toUpperCase() + /*activeTable*/ ctx[1].substring(1)
    	: "") + "";

    	let t1;
    	let t2;
    	let p1;
    	let t4;
    	let ul;
    	let li0;
    	let t6;
    	let li1;
    	let t7;

    	let t8_value = (/*activeTable*/ ctx[1]
    	? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    	: "") + "";

    	let t8;
    	let t9;
    	let li2;
    	let t10;

    	let t11_value = (/*activeTable*/ ctx[1]
    	? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    	: "") + "";

    	let t11;
    	let t12;
    	let t13;
    	let li3;
    	let t14;

    	let t15_value = (/*activeTable*/ ctx[1]
    	? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    	: "") + "";

    	let t15;
    	let t16;
    	let t17;
    	let li4;
    	let t18;
    	let br0;
    	let t19;
    	let t20;
    	let br1;
    	let t21;
    	let t22;
    	let li5;
    	let t23;

    	let t24_value = (/*activeTable*/ ctx[1]
    	? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    	: "") + "";

    	let t24;
    	let t25;
    	let t26;
    	let li6;
    	let t27;
    	let br2;
    	let t28;
    	let t29;
    	let br3;
    	let t30;
    	let t31;
    	let li7;
    	let t32;

    	let t33_value = (/*activeTable*/ ctx[1]
    	? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    	: "") + "";

    	let t33;
    	let t34;
    	let t35;
    	let p2;
    	let t37;
    	let p3;
    	let div_class_value;
    	let each_value_1 = /*headers*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = /*headers*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			p0 = element("p");
    			t0 = text("API Docs for ");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "🍞 BREAD Based API Routes";
    			t4 = space();
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "API_URL: https://babelboxdb.herokuapp.com/api";
    			t6 = space();
    			li1 = element("li");
    			t7 = text("Browse: GET {API_URL}/");
    			t8 = text(t8_value);
    			t9 = space();
    			li2 = element("li");
    			t10 = text("Read: GET {API_URL}/");
    			t11 = text(t11_value);
    			t12 = text("/{:id}");
    			t13 = space();
    			li3 = element("li");
    			t14 = text("Edit: PUT {API_URL}/");
    			t15 = text(t15_value);
    			t16 = text("/{:id}");
    			t17 = space();
    			li4 = element("li");
    			t18 = text("Body: { ");
    			br0 = element("br");
    			t19 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t20 = space();
    			br1 = element("br");
    			t21 = text("\n        }");
    			t22 = space();
    			li5 = element("li");
    			t23 = text("Add: POST {API_URL}/");
    			t24 = text(t24_value);
    			t25 = text("/{:id}");
    			t26 = space();
    			li6 = element("li");
    			t27 = text("Body: { ");
    			br2 = element("br");
    			t28 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t29 = space();
    			br3 = element("br");
    			t30 = text("\n        }");
    			t31 = space();
    			li7 = element("li");
    			t32 = text("Delete: DELETE {API_URL}/");
    			t33 = text(t33_value);
    			t34 = text("/{:id}");
    			t35 = space();
    			p2 = element("p");
    			p2.textContent = "API Docs for Database";
    			t37 = space();
    			p3 = element("p");
    			p3.textContent = "🚀";
    			attr_dev(p0, "class", "text-xl font-semibold text-green-200 p-4");
    			add_location(p0, file$4, 8, 2, 264);
    			attr_dev(p1, "class", "text-lg font-semibold text-green-200 px-4 pb-4");
    			add_location(p1, file$4, 9, 2, 412);
    			attr_dev(li0, "class", "break-words");
    			add_location(li0, file$4, 11, 4, 581);
    			attr_dev(li1, "class", "break-words");
    			add_location(li1, file$4, 12, 4, 660);
    			attr_dev(li2, "class", "break-words");
    			add_location(li2, file$4, 13, 4, 791);
    			attr_dev(li3, "class", "break-words");
    			add_location(li3, file$4, 14, 4, 936);
    			add_location(br0, file$4, 16, 19, 1125);
    			add_location(br1, file$4, 20, 6, 1289);
    			attr_dev(li4, "class", "break-words");
    			add_location(li4, file$4, 15, 4, 1081);
    			attr_dev(li5, "class", "break-words");
    			add_location(li5, file$4, 23, 4, 1328);
    			add_location(br2, file$4, 25, 19, 1517);
    			add_location(br3, file$4, 29, 6, 1681);
    			attr_dev(li6, "class", "break-words");
    			add_location(li6, file$4, 24, 4, 1473);
    			attr_dev(li7, "class", "break-words");
    			add_location(li7, file$4, 32, 4, 1720);
    			attr_dev(ul, "class", "flex flex-col space-y-3 px-4 font-mono text-green-200 text-xs");
    			add_location(ul, file$4, 10, 2, 502);
    			attr_dev(p2, "class", "text-xl font-semibold text-green-200 p-4");
    			add_location(p2, file$4, 34, 2, 1876);
    			attr_dev(p3, "class", "text-lg font-semibold text-green-200 px-4 pb-4");
    			add_location(p3, file$4, 35, 2, 1956);

    			attr_dev(div, "class", div_class_value = `fixed z-50 h-screen w-96 transform duration-300 flex flex-col ${/*showAPIDocs*/ ctx[0]
			? "translate-x-0"
			: "-translate-x-96"} bg-gray-800`);

    			add_location(div, file$4, 7, 0, 119);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, p0);
    			append_dev(p0, t0);
    			append_dev(p0, t1);
    			append_dev(div, t2);
    			append_dev(div, p1);
    			append_dev(div, t4);
    			append_dev(div, ul);
    			append_dev(ul, li0);
    			append_dev(ul, t6);
    			append_dev(ul, li1);
    			append_dev(li1, t7);
    			append_dev(li1, t8);
    			append_dev(ul, t9);
    			append_dev(ul, li2);
    			append_dev(li2, t10);
    			append_dev(li2, t11);
    			append_dev(li2, t12);
    			append_dev(ul, t13);
    			append_dev(ul, li3);
    			append_dev(li3, t14);
    			append_dev(li3, t15);
    			append_dev(li3, t16);
    			append_dev(ul, t17);
    			append_dev(ul, li4);
    			append_dev(li4, t18);
    			append_dev(li4, br0);
    			append_dev(li4, t19);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(li4, null);
    			}

    			append_dev(li4, t20);
    			append_dev(li4, br1);
    			append_dev(li4, t21);
    			append_dev(ul, t22);
    			append_dev(ul, li5);
    			append_dev(li5, t23);
    			append_dev(li5, t24);
    			append_dev(li5, t25);
    			append_dev(ul, t26);
    			append_dev(ul, li6);
    			append_dev(li6, t27);
    			append_dev(li6, br2);
    			append_dev(li6, t28);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(li6, null);
    			}

    			append_dev(li6, t29);
    			append_dev(li6, br3);
    			append_dev(li6, t30);
    			append_dev(ul, t31);
    			append_dev(ul, li7);
    			append_dev(li7, t32);
    			append_dev(li7, t33);
    			append_dev(li7, t34);
    			append_dev(div, t35);
    			append_dev(div, p2);
    			append_dev(div, t37);
    			append_dev(div, p3);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*activeTable*/ 2 && t1_value !== (t1_value = (/*activeTable*/ ctx[1]
    			? /*activeTable*/ ctx[1][0].toUpperCase() + /*activeTable*/ ctx[1].substring(1)
    			: "") + "")) set_data_dev(t1, t1_value);

    			if (dirty & /*activeTable*/ 2 && t8_value !== (t8_value = (/*activeTable*/ ctx[1]
    			? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    			: "") + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*activeTable*/ 2 && t11_value !== (t11_value = (/*activeTable*/ ctx[1]
    			? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    			: "") + "")) set_data_dev(t11, t11_value);

    			if (dirty & /*activeTable*/ 2 && t15_value !== (t15_value = (/*activeTable*/ ctx[1]
    			? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    			: "") + "")) set_data_dev(t15, t15_value);

    			if (dirty & /*headers, camelcase*/ 4) {
    				each_value_1 = /*headers*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(li4, t20);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*activeTable*/ 2 && t24_value !== (t24_value = (/*activeTable*/ ctx[1]
    			? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    			: "") + "")) set_data_dev(t24, t24_value);

    			if (dirty & /*headers, camelcase*/ 4) {
    				each_value = /*headers*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(li6, t29);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*activeTable*/ 2 && t33_value !== (t33_value = (/*activeTable*/ ctx[1]
    			? /*activeTable*/ ctx[1].toLowerCase().replace(/ /g, "-")
    			: "") + "")) set_data_dev(t33, t33_value);

    			if (dirty & /*showAPIDocs*/ 1 && div_class_value !== (div_class_value = `fixed z-50 h-screen w-96 transform duration-300 flex flex-col ${/*showAPIDocs*/ ctx[0]
			? "translate-x-0"
			: "-translate-x-96"} bg-gray-800`)) {
    				attr_dev(div, "class", div_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("ApiDocs", slots, []);
    	let { showAPIDocs } = $$props;
    	let { activeTable } = $$props;
    	let { headers } = $$props;
    	const writable_props = ["showAPIDocs", "activeTable", "headers"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<ApiDocs> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("showAPIDocs" in $$props) $$invalidate(0, showAPIDocs = $$props.showAPIDocs);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("headers" in $$props) $$invalidate(2, headers = $$props.headers);
    	};

    	$$self.$capture_state = () => ({
    		camelcase,
    		showAPIDocs,
    		activeTable,
    		headers
    	});

    	$$self.$inject_state = $$props => {
    		if ("showAPIDocs" in $$props) $$invalidate(0, showAPIDocs = $$props.showAPIDocs);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("headers" in $$props) $$invalidate(2, headers = $$props.headers);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [showAPIDocs, activeTable, headers];
    }

    class ApiDocs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {
    			showAPIDocs: 0,
    			activeTable: 1,
    			headers: 2
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ApiDocs",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*showAPIDocs*/ ctx[0] === undefined && !("showAPIDocs" in props)) {
    			console.warn("<ApiDocs> was created without expected prop 'showAPIDocs'");
    		}

    		if (/*activeTable*/ ctx[1] === undefined && !("activeTable" in props)) {
    			console.warn("<ApiDocs> was created without expected prop 'activeTable'");
    		}

    		if (/*headers*/ ctx[2] === undefined && !("headers" in props)) {
    			console.warn("<ApiDocs> was created without expected prop 'headers'");
    		}
    	}

    	get showAPIDocs() {
    		throw new Error("<ApiDocs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showAPIDocs(value) {
    		throw new Error("<ApiDocs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeTable() {
    		throw new Error("<ApiDocs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTable(value) {
    		throw new Error("<ApiDocs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get headers() {
    		throw new Error("<ApiDocs>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headers(value) {
    		throw new Error("<ApiDocs>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.3 */

    const { console: console_1$2 } = globals;
    const file$5 = "src/App.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[31] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[28] = list[i];
    	return child_ctx;
    }

    // (234:2) {:else}
    function create_else_block_1$1(ctx) {
    	let div2;
    	let div1;
    	let p;
    	let t1;
    	let div0;
    	let t3;
    	let img;
    	let img_src_value;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div1 = element("div");
    			p = element("p");
    			p.textContent = "You don't have any fields yet! Get crafting!";
    			t1 = space();
    			div0 = element("div");
    			div0.textContent = "Create First Field";
    			t3 = space();
    			img = element("img");
    			attr_dev(p, "class", "text-3xl w-96 my-12 text-center font-semibold");
    			add_location(p, file$5, 236, 5, 7578);
    			attr_dev(div0, "class", "bg-green-200 text-gray-900 font-semibold text-lg p-2 flex items-center justify-center rounded-lg cursor-pointer transform duration-150 shadow-md hover:-translate-y-1 hover:shadow-lg");
    			add_location(div0, file$5, 237, 5, 7689);
    			attr_dev(div1, "class", "flex flex-col absolute -ml-48");
    			add_location(div1, file$5, 235, 4, 7529);
    			attr_dev(img, "class", "h-3/4 object-scale");
    			if (img.src !== (img_src_value = "./empty.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$5, 239, 4, 7948);
    			attr_dev(div2, "class", "w-3/4 h-full flex items-center -mt-24 justify-center");
    			add_location(div2, file$5, 234, 3, 7458);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div1);
    			append_dev(div1, p);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div2, t3);
    			append_dev(div2, img);

    			if (!mounted) {
    				dispose = listen_dev(div0, "click", /*newColHeader*/ ctx[14], false, false, false);
    				mounted = true;
    			}
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block_1$1.name,
    		type: "else",
    		source: "(234:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (174:2) {#if headers.length > 0}
    function create_if_block$4(ctx) {
    	let table;
    	let tableheader;
    	let updating_hoverNewField;
    	let updating_headers;
    	let updating_activeTable;
    	let updating_dataTables;
    	let updating_displayedData;
    	let t0;
    	let tbody;
    	let t1;
    	let tr;
    	let td0;
    	let span0;
    	let t3;
    	let t4;
    	let td1;
    	let span1;
    	let t5;
    	let td2;
    	let span2;
    	let td2_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	function tableheader_hoverNewField_binding(value) {
    		/*tableheader_hoverNewField_binding*/ ctx[21](value);
    	}

    	function tableheader_headers_binding(value) {
    		/*tableheader_headers_binding*/ ctx[22](value);
    	}

    	function tableheader_activeTable_binding(value) {
    		/*tableheader_activeTable_binding*/ ctx[23](value);
    	}

    	function tableheader_dataTables_binding(value) {
    		/*tableheader_dataTables_binding*/ ctx[24](value);
    	}

    	function tableheader_displayedData_binding(value) {
    		/*tableheader_displayedData_binding*/ ctx[25](value);
    	}

    	let tableheader_props = {
    		currentUser: /*currentUser*/ ctx[6],
    		fetchData: /*fetchData*/ ctx[10]
    	};

    	if (/*hoverNewField*/ ctx[4] !== void 0) {
    		tableheader_props.hoverNewField = /*hoverNewField*/ ctx[4];
    	}

    	if (/*headers*/ ctx[2] !== void 0) {
    		tableheader_props.headers = /*headers*/ ctx[2];
    	}

    	if (/*activeTable*/ ctx[3] !== void 0) {
    		tableheader_props.activeTable = /*activeTable*/ ctx[3];
    	}

    	if (/*dataTables*/ ctx[0] !== void 0) {
    		tableheader_props.dataTables = /*dataTables*/ ctx[0];
    	}

    	if (/*displayedData*/ ctx[1] !== void 0) {
    		tableheader_props.displayedData = /*displayedData*/ ctx[1];
    	}

    	tableheader = new TableHeader({ props: tableheader_props, $$inline: true });
    	binding_callbacks.push(() => bind(tableheader, "hoverNewField", tableheader_hoverNewField_binding));
    	binding_callbacks.push(() => bind(tableheader, "headers", tableheader_headers_binding));
    	binding_callbacks.push(() => bind(tableheader, "activeTable", tableheader_activeTable_binding));
    	binding_callbacks.push(() => bind(tableheader, "dataTables", tableheader_dataTables_binding));
    	binding_callbacks.push(() => bind(tableheader, "displayedData", tableheader_displayedData_binding));
    	let each_value_1 = /*displayedData*/ ctx[1];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*headers*/ ctx[2];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			create_component(tableheader.$$.fragment);
    			t0 = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t1 = space();
    			tr = element("tr");
    			td0 = element("td");
    			span0 = element("span");
    			span0.textContent = "+";
    			t3 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t4 = space();
    			td1 = element("td");
    			span1 = element("span");
    			t5 = space();
    			td2 = element("td");
    			span2 = element("span");
    			attr_dev(span0, "class", "text-center ml-2 text-base");
    			add_location(span0, file$5, 210, 7, 6860);
    			attr_dev(td0, "class", "border border-gray-300 text-left");
    			add_location(td0, file$5, 209, 6, 6807);
    			attr_dev(span1, "class", "text-center ml-2 text-base");
    			add_location(span1, file$5, 222, 7, 7177);
    			attr_dev(td1, "class", "border border-gray-300 text-left");
    			add_location(td1, file$5, 221, 6, 7124);
    			attr_dev(span2, "class", "text-center ml-2 text-base");
    			add_location(span2, file$5, 227, 7, 7341);
    			attr_dev(td2, "class", td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[4] ? "" : "hidden"}`);
    			add_location(td2, file$5, 226, 6, 7253);
    			attr_dev(tr, "class", "bg-white hover:bg-gray-100 cursor-pointer");
    			add_location(tr, file$5, 208, 5, 6725);
    			attr_dev(tbody, "class", "bg-gray-200");
    			add_location(tbody, file$5, 176, 4, 5248);
    			attr_dev(table, "class", "min-w-full");
    			add_location(table, file$5, 174, 3, 4997);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			mount_component(tableheader, table, null);
    			append_dev(table, t0);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(tbody, null);
    			}

    			append_dev(tbody, t1);
    			append_dev(tbody, tr);
    			append_dev(tr, td0);
    			append_dev(td0, span0);
    			append_dev(tr, t3);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t4);
    			append_dev(tr, td1);
    			append_dev(td1, span1);
    			append_dev(tr, t5);
    			append_dev(tr, td2);
    			append_dev(td2, span2);
    			current = true;

    			if (!mounted) {
    				dispose = listen_dev(tr, "click", /*newRecord*/ ctx[13], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const tableheader_changes = {};
    			if (dirty[0] & /*currentUser*/ 64) tableheader_changes.currentUser = /*currentUser*/ ctx[6];

    			if (!updating_hoverNewField && dirty[0] & /*hoverNewField*/ 16) {
    				updating_hoverNewField = true;
    				tableheader_changes.hoverNewField = /*hoverNewField*/ ctx[4];
    				add_flush_callback(() => updating_hoverNewField = false);
    			}

    			if (!updating_headers && dirty[0] & /*headers*/ 4) {
    				updating_headers = true;
    				tableheader_changes.headers = /*headers*/ ctx[2];
    				add_flush_callback(() => updating_headers = false);
    			}

    			if (!updating_activeTable && dirty[0] & /*activeTable*/ 8) {
    				updating_activeTable = true;
    				tableheader_changes.activeTable = /*activeTable*/ ctx[3];
    				add_flush_callback(() => updating_activeTable = false);
    			}

    			if (!updating_dataTables && dirty[0] & /*dataTables*/ 1) {
    				updating_dataTables = true;
    				tableheader_changes.dataTables = /*dataTables*/ ctx[0];
    				add_flush_callback(() => updating_dataTables = false);
    			}

    			if (!updating_displayedData && dirty[0] & /*displayedData*/ 2) {
    				updating_displayedData = true;
    				tableheader_changes.displayedData = /*displayedData*/ ctx[1];
    				add_flush_callback(() => updating_displayedData = false);
    			}

    			tableheader.$set(tableheader_changes);

    			if (dirty[0] & /*hoverNewField, headers, displayedData, updateField, deleteRecord*/ 6166) {
    				each_value_1 = /*displayedData*/ ctx[1];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(tbody, t1);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty[0] & /*headers*/ 4) {
    				const old_length = each_value.length;
    				each_value = /*headers*/ ctx[2];
    				validate_each_argument(each_value);
    				let i;

    				for (i = old_length; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (!each_blocks[i]) {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t4);
    					}
    				}

    				for (i = each_value.length; i < old_length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (!current || dirty[0] & /*hoverNewField*/ 16 && td2_class_value !== (td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[4] ? "" : "hidden"}`)) {
    				attr_dev(td2, "class", td2_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tableheader.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tableheader.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_component(tableheader);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(174:2) {#if headers.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (197:10) {:else}
    function create_else_block$3(ctx) {
    	let input;
    	let input_value_value;
    	let mounted;
    	let dispose;

    	function keyup_handler() {
    		return /*keyup_handler*/ ctx[27](/*header*/ ctx[28], /*data*/ ctx[31]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "apperance-none focus:outline-none");
    			input.value = input_value_value = /*data*/ ctx[31][camelcase(/*header*/ ctx[28].name.toLowerCase())] || "";
    			add_location(input, file$5, 197, 11, 6305);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);

    			if (!mounted) {
    				dispose = listen_dev(input, "keyup", keyup_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty[0] & /*displayedData, headers*/ 6 && input_value_value !== (input_value_value = /*data*/ ctx[31][camelcase(/*header*/ ctx[28].name.toLowerCase())] || "") && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(197:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (195:10) {#if header.bcrypt}
    function create_if_block_1$4(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = text("************");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(195:10) {#if header.bcrypt}",
    		ctx
    	});

    	return block;
    }

    // (192:7) {#each headers as header}
    function create_each_block_2(ctx) {
    	let td;
    	let span;

    	function select_block_type_1(ctx, dirty) {
    		if (/*header*/ ctx[28].bcrypt) return create_if_block_1$4;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			if_block.c();
    			attr_dev(span, "class", "text-center ml-2 text-base");
    			add_location(span, file$5, 193, 9, 6180);
    			attr_dev(td, "class", "border border-gray-300 text-left");
    			add_location(td, file$5, 192, 8, 6125);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, span);
    			if_block.m(span, null);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(span, null);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(192:7) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    // (178:5) {#each displayedData as data}
    function create_each_block_1$1(ctx) {
    	let tr;
    	let td0;
    	let span0;
    	let svg;
    	let path;
    	let t0;
    	let td1;
    	let span1;
    	let t1_value = /*data*/ ctx[31]._id + "";
    	let t1;
    	let t2;
    	let t3;
    	let td2;
    	let span2;
    	let td2_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[26](/*data*/ ctx[31]);
    	}

    	let each_value_2 = /*headers*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");
    			td0 = element("td");
    			span0 = element("span");
    			svg = svg_element("svg");
    			path = svg_element("path");
    			t0 = space();
    			td1 = element("td");
    			span1 = element("span");
    			t1 = text(t1_value);
    			t2 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t3 = space();
    			td2 = element("td");
    			span2 = element("span");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16");
    			add_location(path, file$5, 182, 10, 5676);
    			attr_dev(svg, "class", "h-4 w-4 text-gray-700 hover:text-gray-900 cursor-pointer");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$5, 181, 9, 5506);
    			attr_dev(span0, "class", "flex items-center justify-center");
    			add_location(span0, file$5, 180, 8, 5409);
    			attr_dev(td0, "class", "bg-white border border-gray-300 text-left");
    			add_location(td0, file$5, 179, 7, 5346);
    			attr_dev(span1, "class", "text-center ml-2 text-base");
    			add_location(span1, file$5, 187, 8, 5993);
    			attr_dev(td1, "class", "bg-white border border-gray-300 text-left");
    			add_location(td1, file$5, 186, 7, 5930);
    			attr_dev(span2, "class", "text-center ml-2 text-base");
    			add_location(span2, file$5, 203, 8, 6624);
    			attr_dev(td2, "class", td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[4] ? "" : "hidden"}`);
    			add_location(td2, file$5, 202, 7, 6535);
    			attr_dev(tr, "class", "bg-white");
    			add_location(tr, file$5, 178, 6, 5317);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);
    			append_dev(tr, td0);
    			append_dev(td0, span0);
    			append_dev(span0, svg);
    			append_dev(svg, path);
    			append_dev(tr, t0);
    			append_dev(tr, td1);
    			append_dev(td1, span1);
    			append_dev(span1, t1);
    			append_dev(tr, t2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t3);
    			append_dev(tr, td2);
    			append_dev(td2, span2);

    			if (!mounted) {
    				dispose = listen_dev(span0, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty[0] & /*displayedData*/ 2 && t1_value !== (t1_value = /*data*/ ctx[31]._id + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*headers, displayedData, updateField*/ 2054) {
    				each_value_2 = /*headers*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t3);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}

    			if (dirty[0] & /*hoverNewField*/ 16 && td2_class_value !== (td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[4] ? "" : "hidden"}`)) {
    				attr_dev(td2, "class", td2_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(178:5) {#each displayedData as data}",
    		ctx
    	});

    	return block;
    }

    // (215:6) {#each headers as header}
    function create_each_block$3(ctx) {
    	let td;
    	let span;

    	const block = {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			attr_dev(span, "class", "text-center ml-2 text-base");
    			add_location(span, file$5, 216, 8, 7032);
    			attr_dev(td, "class", "border border-gray-300 text-left");
    			add_location(td, file$5, 215, 7, 6978);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, span);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(215:6) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let link;
    	let t0;
    	let body;
    	let apidocs;
    	let t1;
    	let loggedin_1;
    	let updating_currentUser;
    	let updating_loggedin;
    	let t2;
    	let header;
    	let updating_showAPIDocs;
    	let updating_activeTable;
    	let updating_headers;
    	let updating_displayedData;
    	let t3;
    	let div;
    	let current_block_type_index;
    	let if_block;
    	let current;

    	apidocs = new ApiDocs({
    			props: {
    				headers: /*headers*/ ctx[2],
    				activeTable: /*activeTable*/ ctx[3],
    				showAPIDocs: /*showAPIDocs*/ ctx[7]
    			},
    			$$inline: true
    		});

    	function loggedin_1_currentUser_binding(value) {
    		/*loggedin_1_currentUser_binding*/ ctx[15](value);
    	}

    	function loggedin_1_loggedin_binding(value) {
    		/*loggedin_1_loggedin_binding*/ ctx[16](value);
    	}

    	let loggedin_1_props = {
    		loadData: /*loadData*/ ctx[9],
    		checkUser: /*checkUser*/ ctx[8]
    	};

    	if (/*currentUser*/ ctx[6] !== void 0) {
    		loggedin_1_props.currentUser = /*currentUser*/ ctx[6];
    	}

    	if (/*loggedin*/ ctx[5] !== void 0) {
    		loggedin_1_props.loggedin = /*loggedin*/ ctx[5];
    	}

    	loggedin_1 = new LoggedIn({ props: loggedin_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(loggedin_1, "currentUser", loggedin_1_currentUser_binding));
    	binding_callbacks.push(() => bind(loggedin_1, "loggedin", loggedin_1_loggedin_binding));

    	function header_showAPIDocs_binding(value) {
    		/*header_showAPIDocs_binding*/ ctx[17](value);
    	}

    	function header_activeTable_binding(value) {
    		/*header_activeTable_binding*/ ctx[18](value);
    	}

    	function header_headers_binding(value) {
    		/*header_headers_binding*/ ctx[19](value);
    	}

    	function header_displayedData_binding(value) {
    		/*header_displayedData_binding*/ ctx[20](value);
    	}

    	let header_props = {
    		currentUser: /*currentUser*/ ctx[6],
    		dataTables: /*dataTables*/ ctx[0],
    		fetchData: /*fetchData*/ ctx[10]
    	};

    	if (/*showAPIDocs*/ ctx[7] !== void 0) {
    		header_props.showAPIDocs = /*showAPIDocs*/ ctx[7];
    	}

    	if (/*activeTable*/ ctx[3] !== void 0) {
    		header_props.activeTable = /*activeTable*/ ctx[3];
    	}

    	if (/*headers*/ ctx[2] !== void 0) {
    		header_props.headers = /*headers*/ ctx[2];
    	}

    	if (/*displayedData*/ ctx[1] !== void 0) {
    		header_props.displayedData = /*displayedData*/ ctx[1];
    	}

    	header = new Header({ props: header_props, $$inline: true });
    	binding_callbacks.push(() => bind(header, "showAPIDocs", header_showAPIDocs_binding));
    	binding_callbacks.push(() => bind(header, "activeTable", header_activeTable_binding));
    	binding_callbacks.push(() => bind(header, "headers", header_headers_binding));
    	binding_callbacks.push(() => bind(header, "displayedData", header_displayedData_binding));
    	const if_block_creators = [create_if_block$4, create_else_block_1$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*headers*/ ctx[2].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			link = element("link");
    			t0 = space();
    			body = element("body");
    			create_component(apidocs.$$.fragment);
    			t1 = space();
    			create_component(loggedin_1.$$.fragment);
    			t2 = space();
    			create_component(header.$$.fragment);
    			t3 = space();
    			div = element("div");
    			if_block.c();
    			attr_dev(link, "href", "https://unpkg.com/tailwindcss@^2/dist/tailwind.min.css");
    			attr_dev(link, "rel", "stylesheet");
    			add_location(link, file$5, 167, 0, 4383);
    			attr_dev(div, "class", "pb-6 w-screen h-full flex justify-center overflow-x-scroll");
    			add_location(div, file$5, 172, 2, 4894);
    			attr_dev(body, "class", "h-screen");
    			add_location(body, file$5, 168, 0, 4469);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, link, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, body, anchor);
    			mount_component(apidocs, body, null);
    			append_dev(body, t1);
    			mount_component(loggedin_1, body, null);
    			append_dev(body, t2);
    			mount_component(header, body, null);
    			append_dev(body, t3);
    			append_dev(body, div);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const apidocs_changes = {};
    			if (dirty[0] & /*headers*/ 4) apidocs_changes.headers = /*headers*/ ctx[2];
    			if (dirty[0] & /*activeTable*/ 8) apidocs_changes.activeTable = /*activeTable*/ ctx[3];
    			if (dirty[0] & /*showAPIDocs*/ 128) apidocs_changes.showAPIDocs = /*showAPIDocs*/ ctx[7];
    			apidocs.$set(apidocs_changes);
    			const loggedin_1_changes = {};

    			if (!updating_currentUser && dirty[0] & /*currentUser*/ 64) {
    				updating_currentUser = true;
    				loggedin_1_changes.currentUser = /*currentUser*/ ctx[6];
    				add_flush_callback(() => updating_currentUser = false);
    			}

    			if (!updating_loggedin && dirty[0] & /*loggedin*/ 32) {
    				updating_loggedin = true;
    				loggedin_1_changes.loggedin = /*loggedin*/ ctx[5];
    				add_flush_callback(() => updating_loggedin = false);
    			}

    			loggedin_1.$set(loggedin_1_changes);
    			const header_changes = {};
    			if (dirty[0] & /*currentUser*/ 64) header_changes.currentUser = /*currentUser*/ ctx[6];
    			if (dirty[0] & /*dataTables*/ 1) header_changes.dataTables = /*dataTables*/ ctx[0];

    			if (!updating_showAPIDocs && dirty[0] & /*showAPIDocs*/ 128) {
    				updating_showAPIDocs = true;
    				header_changes.showAPIDocs = /*showAPIDocs*/ ctx[7];
    				add_flush_callback(() => updating_showAPIDocs = false);
    			}

    			if (!updating_activeTable && dirty[0] & /*activeTable*/ 8) {
    				updating_activeTable = true;
    				header_changes.activeTable = /*activeTable*/ ctx[3];
    				add_flush_callback(() => updating_activeTable = false);
    			}

    			if (!updating_headers && dirty[0] & /*headers*/ 4) {
    				updating_headers = true;
    				header_changes.headers = /*headers*/ ctx[2];
    				add_flush_callback(() => updating_headers = false);
    			}

    			if (!updating_displayedData && dirty[0] & /*displayedData*/ 2) {
    				updating_displayedData = true;
    				header_changes.displayedData = /*displayedData*/ ctx[1];
    				add_flush_callback(() => updating_displayedData = false);
    			}

    			header.$set(header_changes);
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				} else {
    					if_block.p(ctx, dirty);
    				}

    				transition_in(if_block, 1);
    				if_block.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(apidocs.$$.fragment, local);
    			transition_in(loggedin_1.$$.fragment, local);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(apidocs.$$.fragment, local);
    			transition_out(loggedin_1.$$.fragment, local);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(link);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(body);
    			destroy_component(apidocs);
    			destroy_component(loggedin_1);
    			destroy_component(header);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let dataTables = [];
    	let displayedData = [];
    	let headers = [];
    	let activeTable;
    	let hoverNewField = false;
    	let loggedin = false;
    	let currentUser;
    	let showAPIDocs = false;

    	const checkUser = async () => {
    		return await fetch(`/api/users`, {
    			method: "GET",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json",
    				"token": window.sessionStorage.getItem("api_key")
    			}
    		});
    	};

    	const loadData = async () => {
    		const dataResponse = await fetch("api/database");
    		let data = await dataResponse.json();
    		$$invalidate(0, dataTables = data);
    		$$invalidate(3, activeTable = dataTables[1].name);
    		$$invalidate(2, headers = dataTables[1].props);

    		$$invalidate(2, headers = headers.map(h => {
    			h.owner = dataTables[1].owner;
    			return h;
    		}));

    		const tableDataResposne = await fetchData(dataTables[1].name.replace(/ /g, "-"));
    		data = await tableDataResposne.json();
    		$$invalidate(1, displayedData = data);
    		console.log(data);
    		console.log(dataTables);
    	};

    	onMount(async function () {
    		if (!window.sessionStorage.getItem("api_key")) return false;
    		let user = await checkUser();
    		user = await user.json();
    		console.log(user);

    		if (user.username) {
    			$$invalidate(6, currentUser = user);
    			$$invalidate(5, loggedin = true);
    			loadData();
    		}
    	});

    	const fetchData = async table => {
    		return fetch(`api/${table}`);
    	};

    	const updateField = async (field, id) => {
    		console.log(id);

    		await fetch(`/api/${activeTable.replace(/ /g, "-")}/${id}`, {
    			method: "PUT",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({ [camelcase(field)]: event.target.value })
    		});

    		const tableDataResposne = await fetchData(activeTable.replace(/ /g, "-"));
    		let data = await tableDataResposne.json();
    		$$invalidate(1, displayedData = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == activeTable)[0];

    		if (tableHeaders) {
    			$$invalidate(2, headers = tableHeaders.props);

    			$$invalidate(2, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(2, headers = []);
    		}
    	};

    	const deleteRecord = async id => {
    		await fetch(`/api/${activeTable.replace(/ /g, "-")}/${id}`, {
    			method: "DELETE",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			}
    		});

    		const tableDataResposne = await fetchData(activeTable.replace(/ /g, "-"));
    		let data = await tableDataResposne.json();
    		$$invalidate(1, displayedData = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == activeTable)[0];

    		if (tableHeaders) {
    			$$invalidate(2, headers = tableHeaders.props);

    			$$invalidate(2, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(2, headers = []);
    		}
    	};

    	const newRecord = async () => {
    		console.log(activeTable.replace(/ /g, "-"));

    		await fetch(`/api/${activeTable.replace(/ /g, "-")}`, {
    			method: "POST",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({})
    		});

    		const tableDataResposne = await fetchData(activeTable.replace(/ /g, "-"));
    		let data = await tableDataResposne.json();
    		$$invalidate(1, displayedData = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == activeTable)[0];

    		if (tableHeaders) {
    			$$invalidate(2, headers = tableHeaders.props);

    			$$invalidate(2, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(2, headers = []);
    		}

    		console.log(displayedData);
    	};

    	const newColHeader = async () => {
    		const id = "column" + Math.floor(Math.random() * Math.floor(100));

    		await fetch(`/api/database/${activeTable.replace(/ /g, "-")}`, {
    			method: "PUT",
    			headers: {
    				"Accept": "application/json",
    				"Content-Type": "application/json"
    			},
    			body: JSON.stringify({ props: { name: id, type: "String" } })
    		});

    		const dataResponse = await fetch(`api/database`);
    		let data = await dataResponse.json();
    		$$invalidate(0, dataTables = data);
    		let tableHeaders = dataTables.filter(dt => dt.name == activeTable)[0];

    		if (tableHeaders) {
    			$$invalidate(2, headers = tableHeaders.props);

    			$$invalidate(2, headers = headers.map(h => {
    				h.owner = tableHeaders.owner;
    				return h;
    			}));
    		} else {
    			$$invalidate(2, headers = []);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function loggedin_1_currentUser_binding(value) {
    		currentUser = value;
    		$$invalidate(6, currentUser);
    	}

    	function loggedin_1_loggedin_binding(value) {
    		loggedin = value;
    		$$invalidate(5, loggedin);
    	}

    	function header_showAPIDocs_binding(value) {
    		showAPIDocs = value;
    		$$invalidate(7, showAPIDocs);
    	}

    	function header_activeTable_binding(value) {
    		activeTable = value;
    		$$invalidate(3, activeTable);
    	}

    	function header_headers_binding(value) {
    		headers = value;
    		$$invalidate(2, headers);
    	}

    	function header_displayedData_binding(value) {
    		displayedData = value;
    		$$invalidate(1, displayedData);
    	}

    	function tableheader_hoverNewField_binding(value) {
    		hoverNewField = value;
    		$$invalidate(4, hoverNewField);
    	}

    	function tableheader_headers_binding(value) {
    		headers = value;
    		$$invalidate(2, headers);
    	}

    	function tableheader_activeTable_binding(value) {
    		activeTable = value;
    		$$invalidate(3, activeTable);
    	}

    	function tableheader_dataTables_binding(value) {
    		dataTables = value;
    		$$invalidate(0, dataTables);
    	}

    	function tableheader_displayedData_binding(value) {
    		displayedData = value;
    		$$invalidate(1, displayedData);
    	}

    	const click_handler = data => deleteRecord(data._id);
    	const keyup_handler = (header, data) => updateField(header.name, data._id);

    	$$self.$capture_state = () => ({
    		onMount,
    		Header,
    		TableHeader,
    		camelcase,
    		LoggedIn,
    		ApiDocs,
    		dataTables,
    		displayedData,
    		headers,
    		activeTable,
    		hoverNewField,
    		loggedin,
    		currentUser,
    		showAPIDocs,
    		checkUser,
    		loadData,
    		fetchData,
    		updateField,
    		deleteRecord,
    		newRecord,
    		newColHeader
    	});

    	$$self.$inject_state = $$props => {
    		if ("dataTables" in $$props) $$invalidate(0, dataTables = $$props.dataTables);
    		if ("displayedData" in $$props) $$invalidate(1, displayedData = $$props.displayedData);
    		if ("headers" in $$props) $$invalidate(2, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(3, activeTable = $$props.activeTable);
    		if ("hoverNewField" in $$props) $$invalidate(4, hoverNewField = $$props.hoverNewField);
    		if ("loggedin" in $$props) $$invalidate(5, loggedin = $$props.loggedin);
    		if ("currentUser" in $$props) $$invalidate(6, currentUser = $$props.currentUser);
    		if ("showAPIDocs" in $$props) $$invalidate(7, showAPIDocs = $$props.showAPIDocs);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		dataTables,
    		displayedData,
    		headers,
    		activeTable,
    		hoverNewField,
    		loggedin,
    		currentUser,
    		showAPIDocs,
    		checkUser,
    		loadData,
    		fetchData,
    		updateField,
    		deleteRecord,
    		newRecord,
    		newColHeader,
    		loggedin_1_currentUser_binding,
    		loggedin_1_loggedin_binding,
    		header_showAPIDocs_binding,
    		header_activeTable_binding,
    		header_headers_binding,
    		header_displayedData_binding,
    		tableheader_hoverNewField_binding,
    		tableheader_headers_binding,
    		tableheader_activeTable_binding,
    		tableheader_dataTables_binding,
    		tableheader_displayedData_binding,
    		click_handler,
    		keyup_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, [-1, -1]);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
