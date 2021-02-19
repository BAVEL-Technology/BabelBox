
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

    const api = {
    		findIp: async () => {
    			try {
    				const json = (url) => {
    				  return fetch(url).then(res => res.json());
    				};

    				let apiKey = '7be25a9ade8a2bde270fcb94aa63d181c06350d44def3855b0846f24';
    				return json(`https://api.ipdata.co?api-key=${apiKey}`)
    			} catch (err) {
    				console.log(err);
    			}
    		},
    		findToken: async () => {
    			try {
    				let ip = await api.findIp();
    				let getToken = await fetch('/api/r/tokens', {
    						method: 'PUT',
    						headers: {
    							'Accept': 'application/json',
    							'Content-Type': 'application/json'
    						},
    						body: JSON.stringify({ ip: ip.ip })
    				});
    				return getToken
    			} catch (err) {
    				console.log(err);
    			}
    		},
    		login: async (body) => {
    			try {
    				return fetch(`/api/r/admins/login`, {
    						method: 'POST',
    						headers: {
    							'Accept': 'application/json',
    							'Content-Type': 'application/json'
    						},
    						body: JSON.stringify(body)
    				}).then(response => response.json())
    			} catch (err) {
    				console.log(err);
    			}
    		},
    		get: async (url, token) => {
    			try {
    				return fetch(`/api/${url}`, {
    						method: 'GET',
    						headers: {
    							'Accept': 'application/json',
    							'Content-Type': 'application/json',
    							'token': token
    						}
    				}).then(response => response.json())
    			} catch (err) {
    				console.log(err);
    			}
    		},
    		post: async (url, token, body) => {
    			try {
    				return fetch(`/api/${url}`, {
    						method: 'POST',
    						headers: {
    							'Accept': 'application/json',
    							'Content-Type': 'application/json',
    							'token': token
    						},
    						body: JSON.stringify(body)
    				}).then(response => response.json())
    			} catch (err) {
    				console.log(err);
    			}
    		},
    		put: async (url, token, body) => {
    			try {
    				return fetch(`/api/${url}`, {
    						method: 'PUT',
    						headers: {
    							'Accept': 'application/json',
    							'Content-Type': 'application/json',
    							'token': token
    						},
    						body: JSON.stringify(body)
    				}).then(response => response.json())
    			} catch (err) {
    				console.log(err);
    			}
    		},
    		destroy: async (url, token) => {
    			try {
    				return fetch(`/api/${url}`, {
    						method: 'DELETE',
    						headers: {
    							'Accept': 'application/json',
    							'Content-Type': 'application/json',
    							'token': token
    						}
    				}).then(response => response.json())
    			} catch (err) {
    				console.log(err);
    			}
    		}
    	};

    const getHeaders =  (data, filter) => {
      let headers = data.filter((dt) => dt.name == filter)[0];
      return headers.props.map((header) => {
        header.owner = headers.owner;
        return header
      })
    };

    /* src/Header.svelte generated by Svelte v3.32.3 */

    const { console: console_1 } = globals;
    const file = "src/Header.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[21] = list[i];
    	return child_ctx;
    }

    // (134:10) {:else}
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
    			add_location(span, file, 134, 12, 5765);
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
    		source: "(134:10) {:else}",
    		ctx
    	});

    	return block;
    }

    // (129:10) {#if editable == data.name}
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
    			add_location(input, file, 129, 12, 5226);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M5 13l4 4L19 7");
    			add_location(path, file, 131, 14, 5624);
    			attr_dev(svg, "class", "h-3 w-3 text-green-200 ml-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file, 130, 12, 5416);
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
    		source: "(129:10) {#if editable == data.name}",
    		ctx
    	});

    	return block;
    }

    // (136:12) {#if data.name == activeTable && data.owner == currentUser.username}
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
    			add_location(path0, file, 138, 16, 6173);
    			attr_dev(svg0, "class", "h-3 w-3 text-green-200 ml-2");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file, 137, 14, 5988);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16");
    			add_location(path1, file, 141, 16, 6588);
    			attr_dev(svg1, "class", "h-3 w-3 text-green-200 ml-2");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file, 140, 14, 6382);
    			attr_dev(div, "class", "flex items-center");
    			add_location(div, file, 136, 12, 5942);
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
    		source: "(136:12) {#if data.name == activeTable && data.owner == currentUser.username}",
    		ctx
    	});

    	return block;
    }

    // (126:6) {#each dataTables as data}
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
    			add_location(div, file, 127, 10, 5028);

    			attr_dev(li, "class", li_class_value = "" + (null_to_empty(`w-auto border-r border-l border-t border-green-600 flex w-48 items-center justify-between py-1 px-2 rounded-tl-lg rounded-tr-lg text-sm font-medium bg-green-600 text-green-100 transform ${/*data*/ ctx[21].name == /*activeTable*/ ctx[1]
			? "scale-125 z-20"
			: "-ml-1"} origin-bottom shadow-lg cursor-pointer`) + " svelte-1sfhy2t"));

    			add_location(li, file, 126, 8, 4665);
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
			: "-ml-1"} origin-bottom shadow-lg cursor-pointer`) + " svelte-1sfhy2t"))) {
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
    		source: "(126:6) {#each dataTables as data}",
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
    			if (img.src !== (img_src_value = "./bbdb.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file, 93, 2, 2422);
    			attr_dev(p, "class", "text-lg font-semibold text-green-600");
    			add_location(p, file, 94, 2, 2485);
    			attr_dev(div0, "class", "flex items-center ml-8 mt-4");
    			add_location(div0, file, 92, 2, 2378);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "3");
    			attr_dev(path0, "d", "M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4");
    			add_location(path0, file, 100, 10, 2923);
    			attr_dev(svg0, "class", "h-4 w-4 text-green-600 mr-2");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file, 99, 8, 2782);
    			attr_dev(span0, "class", "text-sm font-semibold text-green-600 truncate");
    			add_location(span0, file, 102, 8, 3061);
    			attr_dev(li0, "class", "flex items-center cursor-pointer transform duration-150 hover:-translate-y-1");
    			add_location(li0, file, 98, 6, 2640);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "3");
    			attr_dev(path1, "d", "M12 6v6m0 0v6m0-6h6m-6 0H6");
    			add_location(path1, file, 106, 10, 3421);
    			attr_dev(svg1, "class", "h-4 w-4 text-green-600 mr-2");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file, 105, 8, 3279);
    			attr_dev(span1, "class", "text-sm font-semibold text-green-600 truncate");
    			add_location(span1, file, 108, 8, 3548);
    			attr_dev(li1, "class", "flex items-center cursor-pointer transform duration-150 hover:-translate-y-1");
    			add_location(li1, file, 104, 6, 3155);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2.5");
    			attr_dev(path2, "d", "M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12");
    			add_location(path2, file, 112, 10, 3904);
    			attr_dev(svg2, "class", "h-4 w-4 text-green-600 mr-2");
    			attr_dev(svg2, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg2, "fill", "none");
    			attr_dev(svg2, "viewBox", "0 0 24 24");
    			attr_dev(svg2, "stroke", "currentColor");
    			add_location(svg2, file, 111, 8, 3763);
    			attr_dev(span2, "class", "text-sm font-semibold text-green-600 truncate");
    			add_location(span2, file, 114, 8, 4092);
    			attr_dev(li2, "class", "flex items-center cursor-pointer transform duration-150 hover:-translate-y-1");
    			add_location(li2, file, 110, 6, 3643);
    			attr_dev(input, "id", "json-file");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "class", "invisible");
    			add_location(input, file, 117, 6, 4215);
    			attr_dev(li3, "class", "hidden");
    			add_location(li3, file, 116, 6, 4189);
    			attr_dev(ul0, "class", "flex space-x-4");
    			add_location(ul0, file, 97, 4, 2606);
    			attr_dev(div1, "class", "h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-green-200 text-lg p-2 mr-8 mt-4");
    			add_location(div1, file, 120, 4, 4356);
    			attr_dev(div2, "class", "flex space-x-4 mr-8 mt-4");
    			add_location(div2, file, 96, 2, 2563);
    			attr_dev(div3, "class", "flex w-full justify-between");
    			add_location(div3, file, 91, 2, 2334);
    			attr_dev(ul1, "class", "flex items-center px-4");
    			add_location(ul1, file, 124, 4, 4588);
    			attr_dev(div4, "class", "px-20 pt-12");
    			add_location(div4, file, 123, 2, 4558);
    			attr_dev(div5, "class", "example flex flex-col bg-green-200 border-b-4 border-green-600 w-screen overflow-x-scroll svelte-1sfhy2t");
    			add_location(div5, file, 90, 0, 2228);
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
    					listen_dev(li2, "click", /*uploadFile*/ ctx[9], false, false, false),
    					listen_dev(input, "change", /*change_handler*/ ctx[16], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*currentUser*/ 8 && t13_value !== (t13_value = (/*currentUser*/ ctx[3]
    			? /*currentUser*/ ctx[3].username[0].toUpperCase()
    			: "") + "")) set_data_dev(t13, t13_value);

    			if (dirty & /*dataTables, activeTable, activate, changeTableName, editable, deleteTable, currentUser*/ 475) {
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
    	let { token } = $$props;
    	let editable;

    	const createNewTable = async () => {
    		try {
    			const id = "Table " + Math.floor(Math.random() * Math.floor(100));
    			let table = await api.post("database", token, { name: id, owner: currentUser.username });
    			if (table.status == "duplicate") createNewTable();
    			$$invalidate(0, dataTables = await api.get("database", token));
    			$$invalidate(11, headers = getHeaders(dataTables, activeTable));
    			$$invalidate(1, activeTable = id.toLowerCase());
    			$$invalidate(4, editable = id.toLowerCase());
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const activate = async table => {
    		try {
    			$$invalidate(1, activeTable = table.replace(/-/g, " "));
    			console.log(table);
    			$$invalidate(12, displayedData = await api.get(table, token));
    			console.log(displayedData);
    			$$invalidate(11, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const changeTableName = async table => {
    		try {
    			let name = document.querySelector(`#${table}`).value;
    			let model = await api.put(`database/${table}`, token, { name });
    			$$invalidate(4, editable = "");
    			$$invalidate(0, dataTables = await api.get("database", token));
    			$$invalidate(1, activeTable = name.toLowerCase());
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const deleteTable = async table => {
    		try {
    			let deletion = await api.destroy(`database/${table}`, token);
    			$$invalidate(4, editable = "");
    			$$invalidate(0, dataTables = await api.get("database", token));
    			$$invalidate(1, activeTable = dataTables[0].name);
    			$$invalidate(12, displayedData = await api.get(activeTable, token));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const uploadFile = () => {
    		document.getElementById("json-file").click();
    	};

    	const importJSON = async table => {
    		try {
    			let file = document.getElementById("json-file").files[0];
    			let formData = new FormData();
    			formData.append("file", file);
    			let data = await api.post(`database/${table}/import`, token, formData);
    			$$invalidate(0, dataTables = await api.get("database", token));
    			$$invalidate(12, displayedData = await api.get(activeTable, token));
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
    		"showAPIDocs",
    		"token"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(2, showAPIDocs = !showAPIDocs);
    	const change_handler = () => importJSON(activeTable.replace(/ /g, "-"));
    	const click_handler_1 = data => changeTableName(data.name.replace(/ /g, "-"));
    	const click_handler_2 = data => $$invalidate(4, editable = data.name);
    	const click_handler_3 = data => deleteTable(data.name.replace(/ /g, "-"));
    	const click_handler_4 = data => activate(data.name.replace(/ /g, "-"));

    	$$self.$$set = $$props => {
    		if ("dataTables" in $$props) $$invalidate(0, dataTables = $$props.dataTables);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("headers" in $$props) $$invalidate(11, headers = $$props.headers);
    		if ("fetchData" in $$props) $$invalidate(13, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(12, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(3, currentUser = $$props.currentUser);
    		if ("showAPIDocs" in $$props) $$invalidate(2, showAPIDocs = $$props.showAPIDocs);
    		if ("token" in $$props) $$invalidate(14, token = $$props.token);
    	};

    	$$self.$capture_state = () => ({
    		api,
    		getHeaders,
    		dataTables,
    		activeTable,
    		headers,
    		fetchData,
    		displayedData,
    		currentUser,
    		showAPIDocs,
    		token,
    		editable,
    		createNewTable,
    		activate,
    		changeTableName,
    		deleteTable,
    		uploadFile,
    		importJSON
    	});

    	$$self.$inject_state = $$props => {
    		if ("dataTables" in $$props) $$invalidate(0, dataTables = $$props.dataTables);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("headers" in $$props) $$invalidate(11, headers = $$props.headers);
    		if ("fetchData" in $$props) $$invalidate(13, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(12, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(3, currentUser = $$props.currentUser);
    		if ("showAPIDocs" in $$props) $$invalidate(2, showAPIDocs = $$props.showAPIDocs);
    		if ("token" in $$props) $$invalidate(14, token = $$props.token);
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
    		changeTableName,
    		deleteTable,
    		uploadFile,
    		importJSON,
    		headers,
    		displayedData,
    		fetchData,
    		token,
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
    			headers: 11,
    			fetchData: 13,
    			displayedData: 12,
    			currentUser: 3,
    			showAPIDocs: 2,
    			token: 14
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

    		if (/*headers*/ ctx[11] === undefined && !("headers" in props)) {
    			console_1.warn("<Header> was created without expected prop 'headers'");
    		}

    		if (/*fetchData*/ ctx[13] === undefined && !("fetchData" in props)) {
    			console_1.warn("<Header> was created without expected prop 'fetchData'");
    		}

    		if (/*displayedData*/ ctx[12] === undefined && !("displayedData" in props)) {
    			console_1.warn("<Header> was created without expected prop 'displayedData'");
    		}

    		if (/*currentUser*/ ctx[3] === undefined && !("currentUser" in props)) {
    			console_1.warn("<Header> was created without expected prop 'currentUser'");
    		}

    		if (/*showAPIDocs*/ ctx[2] === undefined && !("showAPIDocs" in props)) {
    			console_1.warn("<Header> was created without expected prop 'showAPIDocs'");
    		}

    		if (/*token*/ ctx[14] === undefined && !("token" in props)) {
    			console_1.warn("<Header> was created without expected prop 'token'");
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

    	get token() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/TypeIcon.svelte generated by Svelte v3.32.3 */

    const file$1 = "src/TypeIcon.svelte";

    // (29:0) {:else}
    function create_else_block_1(ctx) {
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
    		id: create_else_block_1.name,
    		type: "else",
    		source: "(29:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (19:32) 
    function create_if_block_5(ctx) {
    	let if_block_anchor;

    	function select_block_type_1(ctx, dirty) {
    		if (/*type*/ ctx[0].value) return create_if_block_6;
    		return create_else_block$1;
    	}

    	let current_block_type = select_block_type_1(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type_1(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_5.name,
    		type: "if",
    		source: "(19:32) ",
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

    // (24:2) {:else}
    function create_else_block$1(ctx) {
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
    			attr_dev(path, "d", "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z");
    			add_location(path, file$1, 25, 6, 4621);
    			attr_dev(svg, "class", svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$1, 24, 4, 4474);
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
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(24:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (20:2) {#if type.value}
    function create_if_block_6(ctx) {
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
    			attr_dev(path, "d", "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z");
    			add_location(path, file$1, 21, 6, 4271);
    			attr_dev(svg, "class", svg_class_value = `h-4 w-4 ${/*color*/ ctx[1] || "text-gray-500"}`);
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$1, 20, 4, 4124);
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
    		id: create_if_block_6.name,
    		type: "if",
    		source: "(20:2) {#if type.value}",
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
    		if (/*type*/ ctx[0].name == "bcrypt") return create_if_block_5;
    		return create_else_block_1;
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

    const { console: console_1$1 } = globals;
    const file$2 = "src/TableHeader.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[30] = list[i];
    	return child_ctx;
    }

    // (119:12) {:else}
    function create_else_block$2(ctx) {
    	let span;
    	let t0_value = /*header*/ ctx[30].name + "";
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let if_block = /*header*/ ctx[30].owner == /*currentUser*/ ctx[4].username && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(span, "class", "text-gray-900 text-base font-medium flex-grow");
    			add_location(span, file$2, 119, 14, 3674);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*headers*/ 1 && t0_value !== (t0_value = /*header*/ ctx[30].name + "")) set_data_dev(t0, t0_value);

    			if (/*header*/ ctx[30].owner == /*currentUser*/ ctx[4].username) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
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
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(119:12) {:else}",
    		ctx
    	});

    	return block;
    }

    // (114:12) {#if editFieldName == header.name}
    function create_if_block$2(ctx) {
    	let input;
    	let input_id_value;
    	let input_value_value;
    	let t;
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[17](/*header*/ ctx[30]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(input, "id", input_id_value = /*header*/ ctx[30].name.replace(/ /g, "-"));
    			attr_dev(input, "class", "focus:outline-none apperance-none bg-gray-200 flex-grow");
    			input.value = input_value_value = /*header*/ ctx[30].name;
    			add_location(input, file$2, 114, 14, 3164);
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M5 13l4 4L19 7");
    			add_location(path, file$2, 116, 16, 3527);
    			attr_dev(svg, "class", "cursor-pointer h-3 w-3 text-gray-900 ml-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$2, 115, 14, 3308);
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

    			if (dirty[0] & /*headers*/ 1 && input_id_value !== (input_id_value = /*header*/ ctx[30].name.replace(/ /g, "-"))) {
    				attr_dev(input, "id", input_id_value);
    			}

    			if (dirty[0] & /*headers*/ 1 && input_value_value !== (input_value_value = /*header*/ ctx[30].name) && input.value !== input_value_value) {
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
    		source: "(114:12) {#if editFieldName == header.name}",
    		ctx
    	});

    	return block;
    }

    // (121:14) {#if header.owner == currentUser.username}
    function create_if_block_1$2(ctx) {
    	let svg;
    	let path;
    	let mounted;
    	let dispose;

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[18](/*header*/ ctx[30]);
    	}

    	const block = {
    		c: function create() {
    			svg = svg_element("svg");
    			path = svg_element("path");
    			attr_dev(path, "stroke-linecap", "round");
    			attr_dev(path, "stroke-linejoin", "round");
    			attr_dev(path, "stroke-width", "2");
    			attr_dev(path, "d", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z");
    			add_location(path, file$2, 122, 18, 4076);
    			attr_dev(svg, "class", "cursor-pointer h-3 w-3 text-gray-900 ml-2");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$2, 121, 16, 3828);
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
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(121:14) {#if header.owner == currentUser.username}",
    		ctx
    	});

    	return block;
    }

    // (110:6) {#each headers as header}
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
    	let span;
    	let t5_value = (/*header*/ ctx[30].default || "Set Default") + "";
    	let t5;
    	let li1_class_value;
    	let t6;
    	let li2;
    	let typeicon1;
    	let t7;
    	let li2_class_value;
    	let t8;
    	let li3;
    	let typeicon2;
    	let t9;
    	let li3_class_value;
    	let t10;
    	let li4;
    	let typeicon3;
    	let t11;
    	let li4_class_value;
    	let t12;
    	let li5;
    	let typeicon4;
    	let t13;
    	let li5_class_value;
    	let t14;
    	let li6;
    	let typeicon5;
    	let t15;
    	let li6_class_value;
    	let t16;
    	let li7;
    	let typeicon6;
    	let t17;
    	let li7_class_value;
    	let div1_class_value;
    	let current;
    	let mounted;
    	let dispose;

    	typeicon0 = new TypeIcon({
    			props: { type: /*header*/ ctx[30].type },
    			$$inline: true
    		});

    	function select_block_type(ctx, dirty) {
    		if (/*editFieldName*/ ctx[5] == /*header*/ ctx[30].name) return create_if_block$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[19](/*header*/ ctx[30]);
    	}

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[20](/*header*/ ctx[30]);
    	}

    	typeicon1 = new TypeIcon({
    			props: {
    				type: "String",
    				color: /*header*/ ctx[30].type == "String"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_4() {
    		return /*click_handler_4*/ ctx[21](/*header*/ ctx[30]);
    	}

    	typeicon2 = new TypeIcon({
    			props: {
    				type: "Number",
    				color: /*header*/ ctx[30].type == "Number"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_5() {
    		return /*click_handler_5*/ ctx[22](/*header*/ ctx[30]);
    	}

    	typeicon3 = new TypeIcon({
    			props: {
    				type: "Boolean",
    				color: /*header*/ ctx[30].type == "Boolean"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_6() {
    		return /*click_handler_6*/ ctx[23](/*header*/ ctx[30]);
    	}

    	typeicon4 = new TypeIcon({
    			props: {
    				type: "Date",
    				color: /*header*/ ctx[30].type == "Date"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_7() {
    		return /*click_handler_7*/ ctx[24](/*header*/ ctx[30]);
    	}

    	typeicon5 = new TypeIcon({
    			props: {
    				type: "Mixed",
    				color: /*header*/ ctx[30].type == "Mixed"
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_8() {
    		return /*click_handler_8*/ ctx[25](/*header*/ ctx[30]);
    	}

    	typeicon6 = new TypeIcon({
    			props: {
    				type: {
    					name: "bcrypt",
    					value: /*header*/ ctx[30].bcrypt
    				},
    				color: /*header*/ ctx[30].bcrypt
    				? "text-white"
    				: "text-gray-400"
    			},
    			$$inline: true
    		});

    	function click_handler_9() {
    		return /*click_handler_9*/ ctx[26](/*header*/ ctx[30]);
    	}

    	const block = {
    		c: function create() {
    			th = element("th");
    			div0 = element("div");
    			create_component(typeicon0.$$.fragment);
    			t0 = space();
    			if_block.c();
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
    			span = element("span");
    			t5 = text(t5_value);
    			t6 = space();
    			li2 = element("li");
    			create_component(typeicon1.$$.fragment);
    			t7 = text("\n                String");
    			t8 = space();
    			li3 = element("li");
    			create_component(typeicon2.$$.fragment);
    			t9 = text("\n                Number");
    			t10 = space();
    			li4 = element("li");
    			create_component(typeicon3.$$.fragment);
    			t11 = text("\n                Boolean");
    			t12 = space();
    			li5 = element("li");
    			create_component(typeicon4.$$.fragment);
    			t13 = text("\n                Date");
    			t14 = space();
    			li6 = element("li");
    			create_component(typeicon5.$$.fragment);
    			t15 = text("\n                Mixed");
    			t16 = space();
    			li7 = element("li");
    			create_component(typeicon6.$$.fragment);
    			t17 = text("\n                bcrypt");
    			attr_dev(div0, "class", "flex items-center");
    			add_location(div0, file$2, 111, 10, 3028);
    			attr_dev(path0, "stroke-linecap", "round");
    			attr_dev(path0, "stroke-linejoin", "round");
    			attr_dev(path0, "stroke-width", "2");
    			attr_dev(path0, "d", "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z");
    			add_location(path0, file$2, 131, 16, 4809);
    			attr_dev(svg0, "class", "text-white h-4 w-4 mr-3");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "viewBox", "0 0 24 24");
    			attr_dev(svg0, "stroke", "currentColor");
    			add_location(svg0, file$2, 130, 14, 4666);
    			attr_dev(li0, "class", "rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center text-white text-sm font-medium");
    			add_location(li0, file$2, 129, 14, 4494);
    			attr_dev(path1, "stroke-linecap", "round");
    			attr_dev(path1, "stroke-linejoin", "round");
    			attr_dev(path1, "stroke-width", "2");
    			attr_dev(path1, "d", "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z");
    			add_location(path1, file$2, 137, 16, 5470);
    			attr_dev(path2, "stroke-linecap", "round");
    			attr_dev(path2, "stroke-linejoin", "round");
    			attr_dev(path2, "stroke-width", "2");
    			attr_dev(path2, "d", "M15 12a3 3 0 11-6 0 3 3 0 016 0z");
    			add_location(path2, file$2, 138, 16, 6047);
    			attr_dev(svg1, "class", "flex-shrink-0 h-4 w-4 mr-3");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "viewBox", "0 0 24 24");
    			attr_dev(svg1, "stroke", "currentColor");
    			add_location(svg1, file$2, 136, 14, 5324);
    			attr_dev(span, "class", "truncate");
    			add_location(span, file$2, 140, 16, 6194);

    			attr_dev(li1, "class", li1_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].default
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li1, file$2, 135, 14, 5070);

    			attr_dev(li2, "class", li2_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "String"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li2, file$2, 142, 14, 6292);

    			attr_dev(li3, "class", li3_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Number"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li3, file$2, 146, 14, 6680);

    			attr_dev(li4, "class", li4_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Boolean"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li4, file$2, 150, 14, 7068);

    			attr_dev(li5, "class", li5_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Date"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li5, file$2, 154, 14, 7461);

    			attr_dev(li6, "class", li6_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Mixed"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li6, file$2, 158, 14, 7839);

    			attr_dev(li7, "class", li7_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].bcrypt
			? "text-white"
			: "text-gray-400"} text-sm font-medium`);

    			add_location(li7, file$2, 162, 14, 8222);
    			add_location(ul, file$2, 128, 12, 4475);

    			attr_dev(div1, "class", div1_class_value = `flex flex-col absolute z-10 mt-4 w-48 p-2 bg-gray-700 rounded-md ${/*fieldEdit*/ ctx[2] == /*header*/ ctx[30].name
			? ""
			: "hidden"}`);

    			add_location(div1, file$2, 127, 10, 4338);
    			attr_dev(th, "class", "p-2 bg-gray-200 border-l border-r border-gray-400 text-left");
    			add_location(th, file$2, 110, 8, 2945);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, div0);
    			mount_component(typeicon0, div0, null);
    			append_dev(div0, t0);
    			if_block.m(div0, null);
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
    			append_dev(li1, span);
    			append_dev(span, t5);
    			append_dev(ul, t6);
    			append_dev(ul, li2);
    			mount_component(typeicon1, li2, null);
    			append_dev(li2, t7);
    			append_dev(ul, t8);
    			append_dev(ul, li3);
    			mount_component(typeicon2, li3, null);
    			append_dev(li3, t9);
    			append_dev(ul, t10);
    			append_dev(ul, li4);
    			mount_component(typeicon3, li4, null);
    			append_dev(li4, t11);
    			append_dev(ul, t12);
    			append_dev(ul, li5);
    			mount_component(typeicon4, li5, null);
    			append_dev(li5, t13);
    			append_dev(ul, t14);
    			append_dev(ul, li6);
    			mount_component(typeicon5, li6, null);
    			append_dev(li6, t15);
    			append_dev(ul, t16);
    			append_dev(ul, li7);
    			mount_component(typeicon6, li7, null);
    			append_dev(li7, t17);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(li0, "click", click_handler_2, false, false, false),
    					listen_dev(li1, "click", click_handler_3, false, false, false),
    					listen_dev(li2, "click", click_handler_4, false, false, false),
    					listen_dev(li3, "click", click_handler_5, false, false, false),
    					listen_dev(li4, "click", click_handler_6, false, false, false),
    					listen_dev(li5, "click", click_handler_7, false, false, false),
    					listen_dev(li6, "click", click_handler_8, false, false, false),
    					listen_dev(li7, "click", click_handler_9, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const typeicon0_changes = {};
    			if (dirty[0] & /*headers*/ 1) typeicon0_changes.type = /*header*/ ctx[30].type;
    			typeicon0.$set(typeicon0_changes);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if ((!current || dirty[0] & /*headers*/ 1) && t5_value !== (t5_value = (/*header*/ ctx[30].default || "Set Default") + "")) set_data_dev(t5, t5_value);

    			if (!current || dirty[0] & /*headers*/ 1 && li1_class_value !== (li1_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].default
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li1, "class", li1_class_value);
    			}

    			const typeicon1_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon1_changes.color = /*header*/ ctx[30].type == "String"
    			? "text-white"
    			: "text-gray-400";

    			typeicon1.$set(typeicon1_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li2_class_value !== (li2_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "String"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li2, "class", li2_class_value);
    			}

    			const typeicon2_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon2_changes.color = /*header*/ ctx[30].type == "Number"
    			? "text-white"
    			: "text-gray-400";

    			typeicon2.$set(typeicon2_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li3_class_value !== (li3_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Number"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li3, "class", li3_class_value);
    			}

    			const typeicon3_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon3_changes.color = /*header*/ ctx[30].type == "Boolean"
    			? "text-white"
    			: "text-gray-400";

    			typeicon3.$set(typeicon3_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li4_class_value !== (li4_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Boolean"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li4, "class", li4_class_value);
    			}

    			const typeicon4_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon4_changes.color = /*header*/ ctx[30].type == "Date"
    			? "text-white"
    			: "text-gray-400";

    			typeicon4.$set(typeicon4_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li5_class_value !== (li5_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Date"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li5, "class", li5_class_value);
    			}

    			const typeicon5_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon5_changes.color = /*header*/ ctx[30].type == "Mixed"
    			? "text-white"
    			: "text-gray-400";

    			typeicon5.$set(typeicon5_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li6_class_value !== (li6_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].type == "Mixed"
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li6, "class", li6_class_value);
    			}

    			const typeicon6_changes = {};

    			if (dirty[0] & /*headers*/ 1) typeicon6_changes.type = {
    				name: "bcrypt",
    				value: /*header*/ ctx[30].bcrypt
    			};

    			if (dirty[0] & /*headers*/ 1) typeicon6_changes.color = /*header*/ ctx[30].bcrypt
    			? "text-white"
    			: "text-gray-400";

    			typeicon6.$set(typeicon6_changes);

    			if (!current || dirty[0] & /*headers*/ 1 && li7_class_value !== (li7_class_value = `rounded-sm p-2 cursor-pointer hover:bg-gray-500 flex items-center ${/*header*/ ctx[30].bcrypt
			? "text-white"
			: "text-gray-400"} text-sm font-medium`)) {
    				attr_dev(li7, "class", li7_class_value);
    			}

    			if (!current || dirty[0] & /*fieldEdit, headers*/ 5 && div1_class_value !== (div1_class_value = `flex flex-col absolute z-10 mt-4 w-48 p-2 bg-gray-700 rounded-md ${/*fieldEdit*/ ctx[2] == /*header*/ ctx[30].name
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
    			transition_in(typeicon6.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(typeicon0.$$.fragment, local);
    			transition_out(typeicon1.$$.fragment, local);
    			transition_out(typeicon2.$$.fragment, local);
    			transition_out(typeicon3.$$.fragment, local);
    			transition_out(typeicon4.$$.fragment, local);
    			transition_out(typeicon5.$$.fragment, local);
    			transition_out(typeicon6.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			destroy_component(typeicon0);
    			if_block.d();
    			destroy_component(typeicon1);
    			destroy_component(typeicon2);
    			destroy_component(typeicon3);
    			destroy_component(typeicon4);
    			destroy_component(typeicon5);
    			destroy_component(typeicon6);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(110:6) {#each headers as header}",
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
    			add_location(th0, file$2, 104, 4, 2645);
    			attr_dev(span0, "class", "text-gray-900 text-base font-medium");
    			add_location(span0, file$2, 107, 6, 2835);
    			attr_dev(th1, "class", "p-2 bg-gray-200 border-l border-r border-gray-400 text-left bg-gray-200");
    			add_location(th1, file$2, 106, 4, 2744);
    			attr_dev(span1, "class", "text-gray-900 text-base font-medium px-4");
    			add_location(span1, file$2, 171, 8, 8972);

    			attr_dev(th2, "class", th2_class_value = `${/*headers*/ ctx[0][0].owner == /*currentUser*/ ctx[4].username
			? ""
			: "hidden"} p-2 bg-gray-200 border-l border-r border-gray-400 text-center cursor-pointer`);

    			add_location(th2, file$2, 170, 6, 8685);
    			attr_dev(tr, "class", "");
    			add_location(tr, file$2, 103, 2, 2627);
    			attr_dev(thead, "class", "justify-between sticky top-0 border-b-4 border-gray-300");
    			add_location(thead, file$2, 102, 0, 2553);
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
    					listen_dev(th2, "mouseover", /*mouseover_handler*/ ctx[27], false, false, false),
    					listen_dev(th2, "mouseout", /*mouseout_handler*/ ctx[28], false, false, false),
    					listen_dev(th2, "click", /*click_handler_10*/ ctx[29], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty[0] & /*fieldEdit, headers, changeBcrypt, changeType, setDefault, editThisFieldName, changeFieldName, editFieldName, currentUser*/ 3061) {
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

    			if (!current || dirty[0] & /*headers, currentUser*/ 17 && th2_class_value !== (th2_class_value = `${/*headers*/ ctx[0][0].owner == /*currentUser*/ ctx[4].username
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
    	let { token } = $$props;
    	let { settingDefault } = $$props;
    	let editFieldName;
    	let { fieldEdit } = $$props;

    	const editThisFieldName = field => {
    		$$invalidate(5, editFieldName = field);
    		let id = field.replace(/ /g, "-");

    		setTimeout(
    			() => {
    				document.querySelector(`#${id}`).focus();
    			},
    			10
    		);
    	};

    	const changeFieldName = async (field, id) => {
    		try {
    			let domId = field.replace(/ /g, "-");
    			let name = document.querySelector(`#${domId}`).value;
    			let update = await api.put(`database/${activeTable.replace(/ /g, "-")}/${id}`, token, { name });
    			$$invalidate(5, editFieldName = "");
    			$$invalidate(13, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(12, dataTables = await api.get("database", token));
    			$$invalidate(0, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const changeType = async (field, id, type) => {
    		try {
    			let update = await api.put(`database/${activeTable.replace(/ /g, "-")}/${id}`, token, { type });
    			$$invalidate(2, fieldEdit = "");
    			$$invalidate(13, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(12, dataTables = await api.get("database", token));
    			$$invalidate(0, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const changeBcrypt = async (field, id, bcrypt) => {
    		try {
    			let update = await api.put(`database/${activeTable.replace(/ /g, "-")}/${id}`, token, { bcrypt });
    			$$invalidate(2, fieldEdit = "");
    			$$invalidate(13, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(12, dataTables = await api.get("database", token));
    			$$invalidate(0, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const newColHeader = async table => {
    		try {
    			const id = "column" + Math.floor(Math.random() * Math.floor(100));
    			let col = await api.put(`database/${table}`, token, { props: { name: id, type: "String" } });
    			$$invalidate(13, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(12, dataTables = await api.get("database", token));
    			$$invalidate(0, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const setDefault = (name, def, _id) => {
    		console.log("settingDefault");
    		console.log(def);
    		$$invalidate(14, settingDefault = { name, def, _id });
    	};

    	const writable_props = [
    		"headers",
    		"activeTable",
    		"hoverNewField",
    		"dataTables",
    		"fetchData",
    		"displayedData",
    		"currentUser",
    		"token",
    		"settingDefault",
    		"fieldEdit"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<TableHeader> was created with unknown prop '${key}'`);
    	});

    	const click_handler = header => changeFieldName(header.name, header._id);

    	const click_handler_1 = header => fieldEdit == header.name
    	? $$invalidate(2, fieldEdit = "")
    	: $$invalidate(2, fieldEdit = header.name);

    	const click_handler_2 = header => editThisFieldName(header.name);
    	const click_handler_3 = header => setDefault(header.name.replace(/ /g, "-"), header.default, header._id);
    	const click_handler_4 = header => changeType(header.name, header._id, "String");
    	const click_handler_5 = header => changeType(header.name, header._id, "Number");
    	const click_handler_6 = header => changeType(header.name, header._id, "Boolean");
    	const click_handler_7 = header => changeType(header.name, header._id, "Date");
    	const click_handler_8 = header => changeType(header.name, header._id, "Mixed");
    	const click_handler_9 = header => changeBcrypt(header.name, header._id, !header.bcrypt);
    	const mouseover_handler = () => $$invalidate(1, hoverNewField = true);
    	const mouseout_handler = () => $$invalidate(1, hoverNewField = false);
    	const click_handler_10 = () => newColHeader(activeTable);

    	$$self.$$set = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(3, activeTable = $$props.activeTable);
    		if ("hoverNewField" in $$props) $$invalidate(1, hoverNewField = $$props.hoverNewField);
    		if ("dataTables" in $$props) $$invalidate(12, dataTables = $$props.dataTables);
    		if ("fetchData" in $$props) $$invalidate(15, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(13, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(4, currentUser = $$props.currentUser);
    		if ("token" in $$props) $$invalidate(16, token = $$props.token);
    		if ("settingDefault" in $$props) $$invalidate(14, settingDefault = $$props.settingDefault);
    		if ("fieldEdit" in $$props) $$invalidate(2, fieldEdit = $$props.fieldEdit);
    	};

    	$$self.$capture_state = () => ({
    		TypeIcon,
    		api,
    		getHeaders,
    		headers,
    		activeTable,
    		hoverNewField,
    		dataTables,
    		fetchData,
    		displayedData,
    		currentUser,
    		token,
    		settingDefault,
    		editFieldName,
    		fieldEdit,
    		editThisFieldName,
    		changeFieldName,
    		changeType,
    		changeBcrypt,
    		newColHeader,
    		setDefault
    	});

    	$$self.$inject_state = $$props => {
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(3, activeTable = $$props.activeTable);
    		if ("hoverNewField" in $$props) $$invalidate(1, hoverNewField = $$props.hoverNewField);
    		if ("dataTables" in $$props) $$invalidate(12, dataTables = $$props.dataTables);
    		if ("fetchData" in $$props) $$invalidate(15, fetchData = $$props.fetchData);
    		if ("displayedData" in $$props) $$invalidate(13, displayedData = $$props.displayedData);
    		if ("currentUser" in $$props) $$invalidate(4, currentUser = $$props.currentUser);
    		if ("token" in $$props) $$invalidate(16, token = $$props.token);
    		if ("settingDefault" in $$props) $$invalidate(14, settingDefault = $$props.settingDefault);
    		if ("editFieldName" in $$props) $$invalidate(5, editFieldName = $$props.editFieldName);
    		if ("fieldEdit" in $$props) $$invalidate(2, fieldEdit = $$props.fieldEdit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		headers,
    		hoverNewField,
    		fieldEdit,
    		activeTable,
    		currentUser,
    		editFieldName,
    		editThisFieldName,
    		changeFieldName,
    		changeType,
    		changeBcrypt,
    		newColHeader,
    		setDefault,
    		dataTables,
    		displayedData,
    		settingDefault,
    		fetchData,
    		token,
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
    				activeTable: 3,
    				hoverNewField: 1,
    				dataTables: 12,
    				fetchData: 15,
    				displayedData: 13,
    				currentUser: 4,
    				token: 16,
    				settingDefault: 14,
    				fieldEdit: 2
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
    			console_1$1.warn("<TableHeader> was created without expected prop 'headers'");
    		}

    		if (/*activeTable*/ ctx[3] === undefined && !("activeTable" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'activeTable'");
    		}

    		if (/*hoverNewField*/ ctx[1] === undefined && !("hoverNewField" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'hoverNewField'");
    		}

    		if (/*dataTables*/ ctx[12] === undefined && !("dataTables" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'dataTables'");
    		}

    		if (/*fetchData*/ ctx[15] === undefined && !("fetchData" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'fetchData'");
    		}

    		if (/*displayedData*/ ctx[13] === undefined && !("displayedData" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'displayedData'");
    		}

    		if (/*currentUser*/ ctx[4] === undefined && !("currentUser" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'currentUser'");
    		}

    		if (/*token*/ ctx[16] === undefined && !("token" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'token'");
    		}

    		if (/*settingDefault*/ ctx[14] === undefined && !("settingDefault" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'settingDefault'");
    		}

    		if (/*fieldEdit*/ ctx[2] === undefined && !("fieldEdit" in props)) {
    			console_1$1.warn("<TableHeader> was created without expected prop 'fieldEdit'");
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

    	get token() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get settingDefault() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settingDefault(value) {
    		throw new Error("<TableHeader>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fieldEdit() {
    		throw new Error("<TableHeader>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fieldEdit(value) {
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

    const { console: console_1$2 } = globals;
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
    			add_location(input0, file$3, 31, 4, 975);
    			attr_dev(input1, "id", "password");
    			attr_dev(input1, "class", "bg-green-200 apperance-none border-green-600 border rounded-lg focus:outline-none ring-green-600 text-green-600 ring-4 ring-opacity-0 focus:ring-opacity-80 p-2");
    			attr_dev(input1, "placeholder", "password");
    			attr_dev(input1, "type", "password");
    			add_location(input1, file$3, 32, 4, 1207);
    			attr_dev(div0, "class", "bg-green-600 border-4 border-green-600 hover:bg-green-200 hover:text-green-600 text-white text-xl font-semibold p-2 rounded-lg w-full flex items-center justify-center cursor-pointer");
    			add_location(div0, file$3, 33, 4, 1442);
    			attr_dev(div1, "class", "flex-col space-y-6 border-4 border-green-600 rounded-lg bg-green-200 p-12 flex items-center justify-center");
    			add_location(div1, file$3, 30, 2, 850);
    			attr_dev(div2, "class", div2_class_value = `${/*loggedin*/ ctx[0] ? "hidden" : ""} z-30 fixed w-screen h-screen bg-green-200 flex items-center justify-center`);
    			add_location(div2, file$3, 29, 0, 729);
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
    		let token = await api.login({
    			username: document.querySelector("#username").value,
    			password: document.querySelector("#password").value
    		});

    		if (token.message) {
    			console.log(token.message);
    			return;
    		}

    		window.sessionStorage.setItem("api_key", token.token);
    		let ip = await api.findIp();
    		console.log(token.token, ip.ip);

    		await api.post("/r/tokens", "", {
    			ip: ip.ip,
    			token: token.token,
    			access: "admin"
    		});

    		let user = await checkUser();

    		if (user.username) {
    			$$invalidate(2, currentUser = user);
    			$$invalidate(0, loggedin = true);
    			loadData();
    		}
    	};

    	const writable_props = ["loggedin", "currentUser", "checkUser", "loadData"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$2.warn(`<LoggedIn> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("loggedin" in $$props) $$invalidate(0, loggedin = $$props.loggedin);
    		if ("currentUser" in $$props) $$invalidate(2, currentUser = $$props.currentUser);
    		if ("checkUser" in $$props) $$invalidate(3, checkUser = $$props.checkUser);
    		if ("loadData" in $$props) $$invalidate(4, loadData = $$props.loadData);
    	};

    	$$self.$capture_state = () => ({
    		api,
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
    			console_1$2.warn("<LoggedIn> was created without expected prop 'loggedin'");
    		}

    		if (/*currentUser*/ ctx[2] === undefined && !("currentUser" in props)) {
    			console_1$2.warn("<LoggedIn> was created without expected prop 'currentUser'");
    		}

    		if (/*checkUser*/ ctx[3] === undefined && !("checkUser" in props)) {
    			console_1$2.warn("<LoggedIn> was created without expected prop 'checkUser'");
    		}

    		if (/*loadData*/ ctx[4] === undefined && !("loadData" in props)) {
    			console_1$2.warn("<LoggedIn> was created without expected prop 'loadData'");
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
    			add_location(br, file$4, 18, 94, 1262);
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
    			add_location(br, file$4, 27, 94, 1654);
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
    			add_location(p0, file$4, 8, 2, 267);
    			attr_dev(p1, "class", "text-lg font-semibold text-green-200 px-4 pb-4");
    			add_location(p1, file$4, 9, 2, 415);
    			attr_dev(li0, "class", "break-words");
    			add_location(li0, file$4, 11, 4, 584);
    			attr_dev(li1, "class", "break-words");
    			add_location(li1, file$4, 12, 4, 663);
    			attr_dev(li2, "class", "break-words");
    			add_location(li2, file$4, 13, 4, 794);
    			attr_dev(li3, "class", "break-words");
    			add_location(li3, file$4, 14, 4, 939);
    			add_location(br0, file$4, 16, 19, 1128);
    			add_location(br1, file$4, 20, 6, 1292);
    			attr_dev(li4, "class", "break-words");
    			add_location(li4, file$4, 15, 4, 1084);
    			attr_dev(li5, "class", "break-words");
    			add_location(li5, file$4, 23, 4, 1331);
    			add_location(br2, file$4, 25, 19, 1520);
    			add_location(br3, file$4, 29, 6, 1684);
    			attr_dev(li6, "class", "break-words");
    			add_location(li6, file$4, 24, 4, 1476);
    			attr_dev(li7, "class", "break-words");
    			add_location(li7, file$4, 32, 4, 1723);
    			attr_dev(ul, "class", "flex flex-col space-y-3 px-4 font-mono text-green-200 text-xs");
    			add_location(ul, file$4, 10, 2, 505);
    			attr_dev(p2, "class", "text-xl font-semibold text-green-200 p-4");
    			add_location(p2, file$4, 34, 2, 1879);
    			attr_dev(p3, "class", "text-lg font-semibold text-green-200 px-4 pb-4");
    			add_location(p3, file$4, 35, 2, 1959);

    			attr_dev(div, "class", div_class_value = `fixed z-50 h-screen w-1/2 transform duration-300 flex flex-col ${/*showAPIDocs*/ ctx[0]
			? "translate-x-0"
			: "-translate-x-full"} bg-gray-800`);

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

    			if (dirty & /*showAPIDocs*/ 1 && div_class_value !== (div_class_value = `fixed z-50 h-screen w-1/2 transform duration-300 flex flex-col ${/*showAPIDocs*/ ctx[0]
			? "translate-x-0"
			: "-translate-x-full"} bg-gray-800`)) {
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

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /**
     * Parses an URI
     *
     * @author Steven Levithan <stevenlevithan.com> (MIT license)
     * @api private
     */
    var re = /^(?:(?![^:@]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/;

    var parts = [
        'source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'
    ];

    var parseuri = function parseuri(str) {
        var src = str,
            b = str.indexOf('['),
            e = str.indexOf(']');

        if (b != -1 && e != -1) {
            str = str.substring(0, b) + str.substring(b, e).replace(/:/g, ';') + str.substring(e, str.length);
        }

        var m = re.exec(str || ''),
            uri = {},
            i = 14;

        while (i--) {
            uri[parts[i]] = m[i] || '';
        }

        if (b != -1 && e != -1) {
            uri.source = src;
            uri.host = uri.host.substring(1, uri.host.length - 1).replace(/;/g, ':');
            uri.authority = uri.authority.replace('[', '').replace(']', '').replace(/;/g, ':');
            uri.ipv6uri = true;
        }

        uri.pathNames = pathNames(uri, uri['path']);
        uri.queryKey = queryKey(uri, uri['query']);

        return uri;
    };

    function pathNames(obj, path) {
        var regx = /\/{2,9}/g,
            names = path.replace(regx, "/").split("/");

        if (path.substr(0, 1) == '/' || path.length === 0) {
            names.splice(0, 1);
        }
        if (path.substr(path.length - 1, 1) == '/') {
            names.splice(names.length - 1, 1);
        }

        return names;
    }

    function queryKey(uri, query) {
        var data = {};

        query.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function ($0, $1, $2) {
            if ($1) {
                data[$1] = $2;
            }
        });

        return data;
    }

    /**
     * Helpers.
     */
    var s = 1000;
    var m = s * 60;
    var h = m * 60;
    var d = h * 24;
    var w = d * 7;
    var y = d * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong(val) : fmtShort(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w;
        case 'days':
        case 'day':
        case 'd':
          return n * d;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return Math.round(ms / d) + 'd';
      }
      if (msAbs >= h) {
        return Math.round(ms / h) + 'h';
      }
      if (msAbs >= m) {
        return Math.round(ms / m) + 'm';
      }
      if (msAbs >= s) {
        return Math.round(ms / s) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d) {
        return plural(ms, msAbs, d, 'day');
      }
      if (msAbs >= h) {
        return plural(ms, msAbs, h, 'hour');
      }
      if (msAbs >= m) {
        return plural(ms, msAbs, m, 'minute');
      }
      if (msAbs >= s) {
        return plural(ms, msAbs, s, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common = setup;

    /* eslint-env browser */

    var browser = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    var url_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.url = void 0;

    const debug = browser("socket.io-client:url");
    /**
     * URL parser.
     *
     * @param uri - url
     * @param path - the request path of the connection
     * @param loc - An object meant to mimic window.location.
     *        Defaults to window.location.
     * @public
     */
    function url(uri, path = "", loc) {
        let obj = uri;
        // default to window.location
        loc = loc || (typeof location !== "undefined" && location);
        if (null == uri)
            uri = loc.protocol + "//" + loc.host;
        // relative path support
        if (typeof uri === "string") {
            if ("/" === uri.charAt(0)) {
                if ("/" === uri.charAt(1)) {
                    uri = loc.protocol + uri;
                }
                else {
                    uri = loc.host + uri;
                }
            }
            if (!/^(https?|wss?):\/\//.test(uri)) {
                debug("protocol-less url %s", uri);
                if ("undefined" !== typeof loc) {
                    uri = loc.protocol + "//" + uri;
                }
                else {
                    uri = "https://" + uri;
                }
            }
            // parse
            debug("parse %s", uri);
            obj = parseuri(uri);
        }
        // make sure we treat `localhost:80` and `localhost` equally
        if (!obj.port) {
            if (/^(http|ws)$/.test(obj.protocol)) {
                obj.port = "80";
            }
            else if (/^(http|ws)s$/.test(obj.protocol)) {
                obj.port = "443";
            }
        }
        obj.path = obj.path || "/";
        const ipv6 = obj.host.indexOf(":") !== -1;
        const host = ipv6 ? "[" + obj.host + "]" : obj.host;
        // define unique id
        obj.id = obj.protocol + "://" + host + ":" + obj.port + path;
        // define href
        obj.href =
            obj.protocol +
                "://" +
                host +
                (loc && loc.port === obj.port ? "" : ":" + obj.port);
        return obj;
    }
    exports.url = url;
    });

    var hasCors = createCommonjsModule(function (module) {
    /**
     * Module exports.
     *
     * Logic borrowed from Modernizr:
     *
     *   - https://github.com/Modernizr/Modernizr/blob/master/feature-detects/cors.js
     */

    try {
      module.exports = typeof XMLHttpRequest !== 'undefined' &&
        'withCredentials' in new XMLHttpRequest();
    } catch (err) {
      // if XMLHttp support is disabled in IE then it will throw
      // when trying to create
      module.exports = false;
    }
    });

    var globalThis_browser = (() => {
      if (typeof self !== "undefined") {
        return self;
      } else if (typeof window !== "undefined") {
        return window;
      } else {
        return Function("return this")();
      }
    })();

    // browser shim for xmlhttprequest module




    var xmlhttprequest = function(opts) {
      const xdomain = opts.xdomain;

      // scheme must be same when usign XDomainRequest
      // http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx
      const xscheme = opts.xscheme;

      // XDomainRequest has a flow of not sending cookie, therefore it should be disabled as a default.
      // https://github.com/Automattic/engine.io-client/pull/217
      const enablesXDR = opts.enablesXDR;

      // XMLHttpRequest can be disabled on IE
      try {
        if ("undefined" !== typeof XMLHttpRequest && (!xdomain || hasCors)) {
          return new XMLHttpRequest();
        }
      } catch (e) {}

      // Use XDomainRequest for IE8 if enablesXDR is true
      // because loading bar keeps flashing when using jsonp-polling
      // https://github.com/yujiosaka/socke.io-ie8-loading-example
      try {
        if ("undefined" !== typeof XDomainRequest && !xscheme && enablesXDR) {
          return new XDomainRequest();
        }
      } catch (e) {}

      if (!xdomain) {
        try {
          return new globalThis_browser[["Active"].concat("Object").join("X")](
            "Microsoft.XMLHTTP"
          );
        } catch (e) {}
      }
    };

    const PACKET_TYPES = Object.create(null); // no Map = no polyfill
    PACKET_TYPES["open"] = "0";
    PACKET_TYPES["close"] = "1";
    PACKET_TYPES["ping"] = "2";
    PACKET_TYPES["pong"] = "3";
    PACKET_TYPES["message"] = "4";
    PACKET_TYPES["upgrade"] = "5";
    PACKET_TYPES["noop"] = "6";

    const PACKET_TYPES_REVERSE = Object.create(null);
    Object.keys(PACKET_TYPES).forEach(key => {
      PACKET_TYPES_REVERSE[PACKET_TYPES[key]] = key;
    });

    const ERROR_PACKET = { type: "error", data: "parser error" };

    var commons = {
      PACKET_TYPES,
      PACKET_TYPES_REVERSE,
      ERROR_PACKET
    };

    const { PACKET_TYPES: PACKET_TYPES$1 } = commons;

    const withNativeBlob =
      typeof Blob === "function" ||
      (typeof Blob !== "undefined" &&
        Object.prototype.toString.call(Blob) === "[object BlobConstructor]");
    const withNativeArrayBuffer = typeof ArrayBuffer === "function";

    // ArrayBuffer.isView method is not defined in IE10
    const isView = obj => {
      return typeof ArrayBuffer.isView === "function"
        ? ArrayBuffer.isView(obj)
        : obj && obj.buffer instanceof ArrayBuffer;
    };

    const encodePacket = ({ type, data }, supportsBinary, callback) => {
      if (withNativeBlob && data instanceof Blob) {
        if (supportsBinary) {
          return callback(data);
        } else {
          return encodeBlobAsBase64(data, callback);
        }
      } else if (
        withNativeArrayBuffer &&
        (data instanceof ArrayBuffer || isView(data))
      ) {
        if (supportsBinary) {
          return callback(data instanceof ArrayBuffer ? data : data.buffer);
        } else {
          return encodeBlobAsBase64(new Blob([data]), callback);
        }
      }
      // plain string
      return callback(PACKET_TYPES$1[type] + (data || ""));
    };

    const encodeBlobAsBase64 = (data, callback) => {
      const fileReader = new FileReader();
      fileReader.onload = function() {
        const content = fileReader.result.split(",")[1];
        callback("b" + content);
      };
      return fileReader.readAsDataURL(data);
    };

    var encodePacket_browser = encodePacket;

    /*
     * base64-arraybuffer
     * https://github.com/niklasvh/base64-arraybuffer
     *
     * Copyright (c) 2012 Niklas von Hertzen
     * Licensed under the MIT license.
     */

    var base64Arraybuffer = createCommonjsModule(function (module, exports) {
    (function(chars){

      exports.encode = function(arraybuffer) {
        var bytes = new Uint8Array(arraybuffer),
        i, len = bytes.length, base64 = "";

        for (i = 0; i < len; i+=3) {
          base64 += chars[bytes[i] >> 2];
          base64 += chars[((bytes[i] & 3) << 4) | (bytes[i + 1] >> 4)];
          base64 += chars[((bytes[i + 1] & 15) << 2) | (bytes[i + 2] >> 6)];
          base64 += chars[bytes[i + 2] & 63];
        }

        if ((len % 3) === 2) {
          base64 = base64.substring(0, base64.length - 1) + "=";
        } else if (len % 3 === 1) {
          base64 = base64.substring(0, base64.length - 2) + "==";
        }

        return base64;
      };

      exports.decode =  function(base64) {
        var bufferLength = base64.length * 0.75,
        len = base64.length, i, p = 0,
        encoded1, encoded2, encoded3, encoded4;

        if (base64[base64.length - 1] === "=") {
          bufferLength--;
          if (base64[base64.length - 2] === "=") {
            bufferLength--;
          }
        }

        var arraybuffer = new ArrayBuffer(bufferLength),
        bytes = new Uint8Array(arraybuffer);

        for (i = 0; i < len; i+=4) {
          encoded1 = chars.indexOf(base64[i]);
          encoded2 = chars.indexOf(base64[i+1]);
          encoded3 = chars.indexOf(base64[i+2]);
          encoded4 = chars.indexOf(base64[i+3]);

          bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
          bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
          bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
        }

        return arraybuffer;
      };
    })("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/");
    });

    const { PACKET_TYPES_REVERSE: PACKET_TYPES_REVERSE$1, ERROR_PACKET: ERROR_PACKET$1 } = commons;

    const withNativeArrayBuffer$1 = typeof ArrayBuffer === "function";

    let base64decoder;
    if (withNativeArrayBuffer$1) {
      base64decoder = base64Arraybuffer;
    }

    const decodePacket = (encodedPacket, binaryType) => {
      if (typeof encodedPacket !== "string") {
        return {
          type: "message",
          data: mapBinary(encodedPacket, binaryType)
        };
      }
      const type = encodedPacket.charAt(0);
      if (type === "b") {
        return {
          type: "message",
          data: decodeBase64Packet(encodedPacket.substring(1), binaryType)
        };
      }
      const packetType = PACKET_TYPES_REVERSE$1[type];
      if (!packetType) {
        return ERROR_PACKET$1;
      }
      return encodedPacket.length > 1
        ? {
            type: PACKET_TYPES_REVERSE$1[type],
            data: encodedPacket.substring(1)
          }
        : {
            type: PACKET_TYPES_REVERSE$1[type]
          };
    };

    const decodeBase64Packet = (data, binaryType) => {
      if (base64decoder) {
        const decoded = base64decoder.decode(data);
        return mapBinary(decoded, binaryType);
      } else {
        return { base64: true, data }; // fallback for old browsers
      }
    };

    const mapBinary = (data, binaryType) => {
      switch (binaryType) {
        case "blob":
          return data instanceof ArrayBuffer ? new Blob([data]) : data;
        case "arraybuffer":
        default:
          return data; // assuming the data is already an ArrayBuffer
      }
    };

    var decodePacket_browser = decodePacket;

    const SEPARATOR = String.fromCharCode(30); // see https://en.wikipedia.org/wiki/Delimiter#ASCII_delimited_text

    const encodePayload = (packets, callback) => {
      // some packets may be added to the array while encoding, so the initial length must be saved
      const length = packets.length;
      const encodedPackets = new Array(length);
      let count = 0;

      packets.forEach((packet, i) => {
        // force base64 encoding for binary packets
        encodePacket_browser(packet, false, encodedPacket => {
          encodedPackets[i] = encodedPacket;
          if (++count === length) {
            callback(encodedPackets.join(SEPARATOR));
          }
        });
      });
    };

    const decodePayload = (encodedPayload, binaryType) => {
      const encodedPackets = encodedPayload.split(SEPARATOR);
      const packets = [];
      for (let i = 0; i < encodedPackets.length; i++) {
        const decodedPacket = decodePacket_browser(encodedPackets[i], binaryType);
        packets.push(decodedPacket);
        if (decodedPacket.type === "error") {
          break;
        }
      }
      return packets;
    };

    var lib = {
      protocol: 4,
      encodePacket: encodePacket_browser,
      encodePayload,
      decodePacket: decodePacket_browser,
      decodePayload
    };

    var componentEmitter = createCommonjsModule(function (module) {
    /**
     * Expose `Emitter`.
     */

    {
      module.exports = Emitter;
    }

    /**
     * Initialize a new `Emitter`.
     *
     * @api public
     */

    function Emitter(obj) {
      if (obj) return mixin(obj);
    }
    /**
     * Mixin the emitter properties.
     *
     * @param {Object} obj
     * @return {Object}
     * @api private
     */

    function mixin(obj) {
      for (var key in Emitter.prototype) {
        obj[key] = Emitter.prototype[key];
      }
      return obj;
    }

    /**
     * Listen on the given `event` with `fn`.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.on =
    Emitter.prototype.addEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};
      (this._callbacks['$' + event] = this._callbacks['$' + event] || [])
        .push(fn);
      return this;
    };

    /**
     * Adds an `event` listener that will be invoked a single
     * time then automatically removed.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.once = function(event, fn){
      function on() {
        this.off(event, on);
        fn.apply(this, arguments);
      }

      on.fn = fn;
      this.on(event, on);
      return this;
    };

    /**
     * Remove the given callback for `event` or all
     * registered callbacks.
     *
     * @param {String} event
     * @param {Function} fn
     * @return {Emitter}
     * @api public
     */

    Emitter.prototype.off =
    Emitter.prototype.removeListener =
    Emitter.prototype.removeAllListeners =
    Emitter.prototype.removeEventListener = function(event, fn){
      this._callbacks = this._callbacks || {};

      // all
      if (0 == arguments.length) {
        this._callbacks = {};
        return this;
      }

      // specific event
      var callbacks = this._callbacks['$' + event];
      if (!callbacks) return this;

      // remove all handlers
      if (1 == arguments.length) {
        delete this._callbacks['$' + event];
        return this;
      }

      // remove specific handler
      var cb;
      for (var i = 0; i < callbacks.length; i++) {
        cb = callbacks[i];
        if (cb === fn || cb.fn === fn) {
          callbacks.splice(i, 1);
          break;
        }
      }

      // Remove event specific arrays for event types that no
      // one is subscribed for to avoid memory leak.
      if (callbacks.length === 0) {
        delete this._callbacks['$' + event];
      }

      return this;
    };

    /**
     * Emit `event` with the given args.
     *
     * @param {String} event
     * @param {Mixed} ...
     * @return {Emitter}
     */

    Emitter.prototype.emit = function(event){
      this._callbacks = this._callbacks || {};

      var args = new Array(arguments.length - 1)
        , callbacks = this._callbacks['$' + event];

      for (var i = 1; i < arguments.length; i++) {
        args[i - 1] = arguments[i];
      }

      if (callbacks) {
        callbacks = callbacks.slice(0);
        for (var i = 0, len = callbacks.length; i < len; ++i) {
          callbacks[i].apply(this, args);
        }
      }

      return this;
    };

    /**
     * Return array of callbacks for `event`.
     *
     * @param {String} event
     * @return {Array}
     * @api public
     */

    Emitter.prototype.listeners = function(event){
      this._callbacks = this._callbacks || {};
      return this._callbacks['$' + event] || [];
    };

    /**
     * Check if this emitter has `event` handlers.
     *
     * @param {String} event
     * @return {Boolean}
     * @api public
     */

    Emitter.prototype.hasListeners = function(event){
      return !! this.listeners(event).length;
    };
    });

    class Transport extends componentEmitter {
      /**
       * Transport abstract constructor.
       *
       * @param {Object} options.
       * @api private
       */
      constructor(opts) {
        super();

        this.opts = opts;
        this.query = opts.query;
        this.readyState = "";
        this.socket = opts.socket;
      }

      /**
       * Emits an error.
       *
       * @param {String} str
       * @return {Transport} for chaining
       * @api public
       */
      onError(msg, desc) {
        const err = new Error(msg);
        err.type = "TransportError";
        err.description = desc;
        this.emit("error", err);
        return this;
      }

      /**
       * Opens the transport.
       *
       * @api public
       */
      open() {
        if ("closed" === this.readyState || "" === this.readyState) {
          this.readyState = "opening";
          this.doOpen();
        }

        return this;
      }

      /**
       * Closes the transport.
       *
       * @api private
       */
      close() {
        if ("opening" === this.readyState || "open" === this.readyState) {
          this.doClose();
          this.onClose();
        }

        return this;
      }

      /**
       * Sends multiple packets.
       *
       * @param {Array} packets
       * @api private
       */
      send(packets) {
        if ("open" === this.readyState) {
          this.write(packets);
        } else {
          throw new Error("Transport not open");
        }
      }

      /**
       * Called upon open
       *
       * @api private
       */
      onOpen() {
        this.readyState = "open";
        this.writable = true;
        this.emit("open");
      }

      /**
       * Called with data.
       *
       * @param {String} data
       * @api private
       */
      onData(data) {
        const packet = lib.decodePacket(data, this.socket.binaryType);
        this.onPacket(packet);
      }

      /**
       * Called with a decoded packet.
       */
      onPacket(packet) {
        this.emit("packet", packet);
      }

      /**
       * Called upon close.
       *
       * @api private
       */
      onClose() {
        this.readyState = "closed";
        this.emit("close");
      }
    }

    var transport = Transport;

    /**
     * Compiles a querystring
     * Returns string representation of the object
     *
     * @param {Object}
     * @api private
     */
    var encode = function (obj) {
      var str = '';

      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          if (str.length) str += '&';
          str += encodeURIComponent(i) + '=' + encodeURIComponent(obj[i]);
        }
      }

      return str;
    };

    /**
     * Parses a simple querystring into an object
     *
     * @param {String} qs
     * @api private
     */

    var decode = function(qs){
      var qry = {};
      var pairs = qs.split('&');
      for (var i = 0, l = pairs.length; i < l; i++) {
        var pair = pairs[i].split('=');
        qry[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
      }
      return qry;
    };

    var parseqs = {
    	encode: encode,
    	decode: decode
    };

    var alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_'.split('')
      , length = 64
      , map = {}
      , seed = 0
      , i = 0
      , prev;

    /**
     * Return a string representing the specified number.
     *
     * @param {Number} num The number to convert.
     * @returns {String} The string representation of the number.
     * @api public
     */
    function encode$1(num) {
      var encoded = '';

      do {
        encoded = alphabet[num % length] + encoded;
        num = Math.floor(num / length);
      } while (num > 0);

      return encoded;
    }

    /**
     * Return the integer value specified by the given string.
     *
     * @param {String} str The string to convert.
     * @returns {Number} The integer value represented by the string.
     * @api public
     */
    function decode$1(str) {
      var decoded = 0;

      for (i = 0; i < str.length; i++) {
        decoded = decoded * length + map[str.charAt(i)];
      }

      return decoded;
    }

    /**
     * Yeast: A tiny growing id generator.
     *
     * @returns {String} A unique id.
     * @api public
     */
    function yeast() {
      var now = encode$1(+new Date());

      if (now !== prev) return seed = 0, prev = now;
      return now +'.'+ encode$1(seed++);
    }

    //
    // Map each character to its index.
    //
    for (; i < length; i++) map[alphabet[i]] = i;

    //
    // Expose the `yeast`, `encode` and `decode` functions.
    //
    yeast.encode = encode$1;
    yeast.decode = decode$1;
    var yeast_1 = yeast;

    /**
     * Helpers.
     */
    var s$1 = 1000;
    var m$1 = s$1 * 60;
    var h$1 = m$1 * 60;
    var d$1 = h$1 * 24;
    var w$1 = d$1 * 7;
    var y$1 = d$1 * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms$1 = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse$1(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong$1(val) : fmtShort$1(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse$1(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y$1;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w$1;
        case 'days':
        case 'day':
        case 'd':
          return n * d$1;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h$1;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m$1;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s$1;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort$1(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$1) {
        return Math.round(ms / d$1) + 'd';
      }
      if (msAbs >= h$1) {
        return Math.round(ms / h$1) + 'h';
      }
      if (msAbs >= m$1) {
        return Math.round(ms / m$1) + 'm';
      }
      if (msAbs >= s$1) {
        return Math.round(ms / s$1) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong$1(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$1) {
        return plural$1(ms, msAbs, d$1, 'day');
      }
      if (msAbs >= h$1) {
        return plural$1(ms, msAbs, h$1, 'hour');
      }
      if (msAbs >= m$1) {
        return plural$1(ms, msAbs, m$1, 'minute');
      }
      if (msAbs >= s$1) {
        return plural$1(ms, msAbs, s$1, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural$1(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup$1(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms$1;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common$1 = setup$1;

    /* eslint-env browser */

    var browser$1 = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common$1(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    const debug = browser$1("engine.io-client:polling");

    class Polling extends transport {
      /**
       * Transport name.
       */
      get name() {
        return "polling";
      }

      /**
       * Opens the socket (triggers polling). We write a PING message to determine
       * when the transport is open.
       *
       * @api private
       */
      doOpen() {
        this.poll();
      }

      /**
       * Pauses polling.
       *
       * @param {Function} callback upon buffers are flushed and transport is paused
       * @api private
       */
      pause(onPause) {
        const self = this;

        this.readyState = "pausing";

        function pause() {
          debug("paused");
          self.readyState = "paused";
          onPause();
        }

        if (this.polling || !this.writable) {
          let total = 0;

          if (this.polling) {
            debug("we are currently polling - waiting to pause");
            total++;
            this.once("pollComplete", function() {
              debug("pre-pause polling complete");
              --total || pause();
            });
          }

          if (!this.writable) {
            debug("we are currently writing - waiting to pause");
            total++;
            this.once("drain", function() {
              debug("pre-pause writing complete");
              --total || pause();
            });
          }
        } else {
          pause();
        }
      }

      /**
       * Starts polling cycle.
       *
       * @api public
       */
      poll() {
        debug("polling");
        this.polling = true;
        this.doPoll();
        this.emit("poll");
      }

      /**
       * Overloads onData to detect payloads.
       *
       * @api private
       */
      onData(data) {
        const self = this;
        debug("polling got data %s", data);
        const callback = function(packet, index, total) {
          // if its the first message we consider the transport open
          if ("opening" === self.readyState && packet.type === "open") {
            self.onOpen();
          }

          // if its a close packet, we close the ongoing requests
          if ("close" === packet.type) {
            self.onClose();
            return false;
          }

          // otherwise bypass onData and handle the message
          self.onPacket(packet);
        };

        // decode payload
        lib.decodePayload(data, this.socket.binaryType).forEach(callback);

        // if an event did not trigger closing
        if ("closed" !== this.readyState) {
          // if we got data we're not polling
          this.polling = false;
          this.emit("pollComplete");

          if ("open" === this.readyState) {
            this.poll();
          } else {
            debug('ignoring poll - transport state "%s"', this.readyState);
          }
        }
      }

      /**
       * For polling, send a close packet.
       *
       * @api private
       */
      doClose() {
        const self = this;

        function close() {
          debug("writing close packet");
          self.write([{ type: "close" }]);
        }

        if ("open" === this.readyState) {
          debug("transport open - closing");
          close();
        } else {
          // in case we're trying to close while
          // handshaking is in progress (GH-164)
          debug("transport not open - deferring close");
          this.once("open", close);
        }
      }

      /**
       * Writes a packets payload.
       *
       * @param {Array} data packets
       * @param {Function} drain callback
       * @api private
       */
      write(packets) {
        this.writable = false;

        lib.encodePayload(packets, data => {
          this.doWrite(data, () => {
            this.writable = true;
            this.emit("drain");
          });
        });
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "https" : "http";
        let port = "";

        // cache busting is forced
        if (false !== this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        if (!this.supportsBinary && !query.sid) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("https" === schema && Number(this.opts.port) !== 443) ||
            ("http" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }
    }

    var polling = Polling;

    var pick = (obj, ...attr) => {
      return attr.reduce((acc, k) => {
        if (obj.hasOwnProperty(k)) {
          acc[k] = obj[k];
        }
        return acc;
      }, {});
    };

    var util = {
    	pick: pick
    };

    /* global attachEvent */

    const { pick: pick$1 } = util;


    const debug$1 = browser$1("engine.io-client:polling-xhr");

    /**
     * Empty function
     */

    function empty$1() {}

    const hasXHR2 = (function() {
      const xhr = new xmlhttprequest({ xdomain: false });
      return null != xhr.responseType;
    })();

    class XHR extends polling {
      /**
       * XHR Polling constructor.
       *
       * @param {Object} opts
       * @api public
       */
      constructor(opts) {
        super(opts);

        if (typeof location !== "undefined") {
          const isSSL = "https:" === location.protocol;
          let port = location.port;

          // some user agents have empty `location.port`
          if (!port) {
            port = isSSL ? 443 : 80;
          }

          this.xd =
            (typeof location !== "undefined" &&
              opts.hostname !== location.hostname) ||
            port !== opts.port;
          this.xs = opts.secure !== isSSL;
        }
        /**
         * XHR supports binary
         */
        const forceBase64 = opts && opts.forceBase64;
        this.supportsBinary = hasXHR2 && !forceBase64;
      }

      /**
       * Creates a request.
       *
       * @param {String} method
       * @api private
       */
      request(opts = {}) {
        Object.assign(opts, { xd: this.xd, xs: this.xs }, this.opts);
        return new Request(this.uri(), opts);
      }

      /**
       * Sends data.
       *
       * @param {String} data to send.
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        const req = this.request({
          method: "POST",
          data: data
        });
        const self = this;
        req.on("success", fn);
        req.on("error", function(err) {
          self.onError("xhr post error", err);
        });
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        debug$1("xhr poll");
        const req = this.request();
        const self = this;
        req.on("data", function(data) {
          self.onData(data);
        });
        req.on("error", function(err) {
          self.onError("xhr poll error", err);
        });
        this.pollXhr = req;
      }
    }

    class Request extends componentEmitter {
      /**
       * Request constructor
       *
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts) {
        super();
        this.opts = opts;

        this.method = opts.method || "GET";
        this.uri = uri;
        this.async = false !== opts.async;
        this.data = undefined !== opts.data ? opts.data : null;

        this.create();
      }

      /**
       * Creates the XHR object and sends the request.
       *
       * @api private
       */
      create() {
        const opts = pick$1(
          this.opts,
          "agent",
          "enablesXDR",
          "pfx",
          "key",
          "passphrase",
          "cert",
          "ca",
          "ciphers",
          "rejectUnauthorized"
        );
        opts.xdomain = !!this.opts.xd;
        opts.xscheme = !!this.opts.xs;

        const xhr = (this.xhr = new xmlhttprequest(opts));
        const self = this;

        try {
          debug$1("xhr open %s: %s", this.method, this.uri);
          xhr.open(this.method, this.uri, this.async);
          try {
            if (this.opts.extraHeaders) {
              xhr.setDisableHeaderCheck && xhr.setDisableHeaderCheck(true);
              for (let i in this.opts.extraHeaders) {
                if (this.opts.extraHeaders.hasOwnProperty(i)) {
                  xhr.setRequestHeader(i, this.opts.extraHeaders[i]);
                }
              }
            }
          } catch (e) {}

          if ("POST" === this.method) {
            try {
              xhr.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
            } catch (e) {}
          }

          try {
            xhr.setRequestHeader("Accept", "*/*");
          } catch (e) {}

          // ie6 check
          if ("withCredentials" in xhr) {
            xhr.withCredentials = this.opts.withCredentials;
          }

          if (this.opts.requestTimeout) {
            xhr.timeout = this.opts.requestTimeout;
          }

          if (this.hasXDR()) {
            xhr.onload = function() {
              self.onLoad();
            };
            xhr.onerror = function() {
              self.onError(xhr.responseText);
            };
          } else {
            xhr.onreadystatechange = function() {
              if (4 !== xhr.readyState) return;
              if (200 === xhr.status || 1223 === xhr.status) {
                self.onLoad();
              } else {
                // make sure the `error` event handler that's user-set
                // does not throw in the same tick and gets caught here
                setTimeout(function() {
                  self.onError(typeof xhr.status === "number" ? xhr.status : 0);
                }, 0);
              }
            };
          }

          debug$1("xhr data %s", this.data);
          xhr.send(this.data);
        } catch (e) {
          // Need to defer since .create() is called directly from the constructor
          // and thus the 'error' event can only be only bound *after* this exception
          // occurs.  Therefore, also, we cannot throw here at all.
          setTimeout(function() {
            self.onError(e);
          }, 0);
          return;
        }

        if (typeof document !== "undefined") {
          this.index = Request.requestsCount++;
          Request.requests[this.index] = this;
        }
      }

      /**
       * Called upon successful response.
       *
       * @api private
       */
      onSuccess() {
        this.emit("success");
        this.cleanup();
      }

      /**
       * Called if we have data.
       *
       * @api private
       */
      onData(data) {
        this.emit("data", data);
        this.onSuccess();
      }

      /**
       * Called upon error.
       *
       * @api private
       */
      onError(err) {
        this.emit("error", err);
        this.cleanup(true);
      }

      /**
       * Cleans up house.
       *
       * @api private
       */
      cleanup(fromError) {
        if ("undefined" === typeof this.xhr || null === this.xhr) {
          return;
        }
        // xmlhttprequest
        if (this.hasXDR()) {
          this.xhr.onload = this.xhr.onerror = empty$1;
        } else {
          this.xhr.onreadystatechange = empty$1;
        }

        if (fromError) {
          try {
            this.xhr.abort();
          } catch (e) {}
        }

        if (typeof document !== "undefined") {
          delete Request.requests[this.index];
        }

        this.xhr = null;
      }

      /**
       * Called upon load.
       *
       * @api private
       */
      onLoad() {
        const data = this.xhr.responseText;
        if (data !== null) {
          this.onData(data);
        }
      }

      /**
       * Check if it has XDomainRequest.
       *
       * @api private
       */
      hasXDR() {
        return typeof XDomainRequest !== "undefined" && !this.xs && this.enablesXDR;
      }

      /**
       * Aborts the request.
       *
       * @api public
       */
      abort() {
        this.cleanup();
      }
    }

    /**
     * Aborts pending requests when unloading the window. This is needed to prevent
     * memory leaks (e.g. when using IE) and to ensure that no spurious error is
     * emitted.
     */

    Request.requestsCount = 0;
    Request.requests = {};

    if (typeof document !== "undefined") {
      if (typeof attachEvent === "function") {
        attachEvent("onunload", unloadHandler);
      } else if (typeof addEventListener === "function") {
        const terminationEvent = "onpagehide" in globalThis_browser ? "pagehide" : "unload";
        addEventListener(terminationEvent, unloadHandler, false);
      }
    }

    function unloadHandler() {
      for (let i in Request.requests) {
        if (Request.requests.hasOwnProperty(i)) {
          Request.requests[i].abort();
        }
      }
    }

    var pollingXhr = XHR;
    var Request_1 = Request;
    pollingXhr.Request = Request_1;

    const rNewline = /\n/g;
    const rEscapedNewline = /\\n/g;

    /**
     * Global JSONP callbacks.
     */

    let callbacks;

    /**
     * Noop.
     */

    function empty$2() {}

    class JSONPPolling extends polling {
      /**
       * JSONP Polling constructor.
       *
       * @param {Object} opts.
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.query = this.query || {};

        // define global callbacks array if not present
        // we do this here (lazily) to avoid unneeded global pollution
        if (!callbacks) {
          // we need to consider multiple engines in the same page
          callbacks = globalThis_browser.___eio = globalThis_browser.___eio || [];
        }

        // callback identifier
        this.index = callbacks.length;

        // add callback to jsonp global
        const self = this;
        callbacks.push(function(msg) {
          self.onData(msg);
        });

        // append to query string
        this.query.j = this.index;

        // prevent spurious errors from being emitted when the window is unloaded
        if (typeof addEventListener === "function") {
          addEventListener(
            "beforeunload",
            function() {
              if (self.script) self.script.onerror = empty$2;
            },
            false
          );
        }
      }

      /**
       * JSONP only supports binary as base64 encoded strings
       */
      get supportsBinary() {
        return false;
      }

      /**
       * Closes the socket.
       *
       * @api private
       */
      doClose() {
        if (this.script) {
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        if (this.form) {
          this.form.parentNode.removeChild(this.form);
          this.form = null;
          this.iframe = null;
        }

        super.doClose();
      }

      /**
       * Starts a poll cycle.
       *
       * @api private
       */
      doPoll() {
        const self = this;
        const script = document.createElement("script");

        if (this.script) {
          this.script.parentNode.removeChild(this.script);
          this.script = null;
        }

        script.async = true;
        script.src = this.uri();
        script.onerror = function(e) {
          self.onError("jsonp poll error", e);
        };

        const insertAt = document.getElementsByTagName("script")[0];
        if (insertAt) {
          insertAt.parentNode.insertBefore(script, insertAt);
        } else {
          (document.head || document.body).appendChild(script);
        }
        this.script = script;

        const isUAgecko =
          "undefined" !== typeof navigator && /gecko/i.test(navigator.userAgent);

        if (isUAgecko) {
          setTimeout(function() {
            const iframe = document.createElement("iframe");
            document.body.appendChild(iframe);
            document.body.removeChild(iframe);
          }, 100);
        }
      }

      /**
       * Writes with a hidden iframe.
       *
       * @param {String} data to send
       * @param {Function} called upon flush.
       * @api private
       */
      doWrite(data, fn) {
        const self = this;
        let iframe;

        if (!this.form) {
          const form = document.createElement("form");
          const area = document.createElement("textarea");
          const id = (this.iframeId = "eio_iframe_" + this.index);

          form.className = "socketio";
          form.style.position = "absolute";
          form.style.top = "-1000px";
          form.style.left = "-1000px";
          form.target = id;
          form.method = "POST";
          form.setAttribute("accept-charset", "utf-8");
          area.name = "d";
          form.appendChild(area);
          document.body.appendChild(form);

          this.form = form;
          this.area = area;
        }

        this.form.action = this.uri();

        function complete() {
          initIframe();
          fn();
        }

        function initIframe() {
          if (self.iframe) {
            try {
              self.form.removeChild(self.iframe);
            } catch (e) {
              self.onError("jsonp polling iframe removal error", e);
            }
          }

          try {
            // ie6 dynamic iframes with target="" support (thanks Chris Lambacher)
            const html = '<iframe src="javascript:0" name="' + self.iframeId + '">';
            iframe = document.createElement(html);
          } catch (e) {
            iframe = document.createElement("iframe");
            iframe.name = self.iframeId;
            iframe.src = "javascript:0";
          }

          iframe.id = self.iframeId;

          self.form.appendChild(iframe);
          self.iframe = iframe;
        }

        initIframe();

        // escape \n to prevent it from being converted into \r\n by some UAs
        // double escaping is required for escaped new lines because unescaping of new lines can be done safely on server-side
        data = data.replace(rEscapedNewline, "\\\n");
        this.area.value = data.replace(rNewline, "\\n");

        try {
          this.form.submit();
        } catch (e) {}

        if (this.iframe.attachEvent) {
          this.iframe.onreadystatechange = function() {
            if (self.iframe.readyState === "complete") {
              complete();
            }
          };
        } else {
          this.iframe.onload = complete;
        }
      }
    }

    var pollingJsonp = JSONPPolling;

    var websocketConstructor_browser = {
      WebSocket: globalThis_browser.WebSocket || globalThis_browser.MozWebSocket,
      usingBrowserWebSocket: true,
      defaultBinaryType: "arraybuffer"
    };

    const { pick: pick$2 } = util;
    const {
      WebSocket,
      usingBrowserWebSocket,
      defaultBinaryType
    } = websocketConstructor_browser;

    const debug$2 = browser$1("engine.io-client:websocket");

    // detect ReactNative environment
    const isReactNative =
      typeof navigator !== "undefined" &&
      typeof navigator.product === "string" &&
      navigator.product.toLowerCase() === "reactnative";

    class WS extends transport {
      /**
       * WebSocket transport constructor.
       *
       * @api {Object} connection options
       * @api public
       */
      constructor(opts) {
        super(opts);

        this.supportsBinary = !opts.forceBase64;
      }

      /**
       * Transport name.
       *
       * @api public
       */
      get name() {
        return "websocket";
      }

      /**
       * Opens socket.
       *
       * @api private
       */
      doOpen() {
        if (!this.check()) {
          // let probe timeout
          return;
        }

        const uri = this.uri();
        const protocols = this.opts.protocols;

        // React Native only supports the 'headers' option, and will print a warning if anything else is passed
        const opts = isReactNative
          ? {}
          : pick$2(
              this.opts,
              "agent",
              "perMessageDeflate",
              "pfx",
              "key",
              "passphrase",
              "cert",
              "ca",
              "ciphers",
              "rejectUnauthorized",
              "localAddress",
              "protocolVersion",
              "origin",
              "maxPayload",
              "family",
              "checkServerIdentity"
            );

        if (this.opts.extraHeaders) {
          opts.headers = this.opts.extraHeaders;
        }

        try {
          this.ws =
            usingBrowserWebSocket && !isReactNative
              ? protocols
                ? new WebSocket(uri, protocols)
                : new WebSocket(uri)
              : new WebSocket(uri, protocols, opts);
        } catch (err) {
          return this.emit("error", err);
        }

        this.ws.binaryType = this.socket.binaryType || defaultBinaryType;

        this.addEventListeners();
      }

      /**
       * Adds event listeners to the socket
       *
       * @api private
       */
      addEventListeners() {
        const self = this;

        this.ws.onopen = function() {
          self.onOpen();
        };
        this.ws.onclose = function() {
          self.onClose();
        };
        this.ws.onmessage = function(ev) {
          self.onData(ev.data);
        };
        this.ws.onerror = function(e) {
          self.onError("websocket error", e);
        };
      }

      /**
       * Writes data to socket.
       *
       * @param {Array} array of packets.
       * @api private
       */
      write(packets) {
        const self = this;
        this.writable = false;

        // encodePacket efficient as it uses WS framing
        // no need for encodePayload
        let total = packets.length;
        let i = 0;
        const l = total;
        for (; i < l; i++) {
          (function(packet) {
            lib.encodePacket(packet, self.supportsBinary, function(data) {
              // always create a new object (GH-437)
              const opts = {};
              if (!usingBrowserWebSocket) {
                if (packet.options) {
                  opts.compress = packet.options.compress;
                }

                if (self.opts.perMessageDeflate) {
                  const len =
                    "string" === typeof data
                      ? Buffer.byteLength(data)
                      : data.length;
                  if (len < self.opts.perMessageDeflate.threshold) {
                    opts.compress = false;
                  }
                }
              }

              // Sometimes the websocket has already been closed but the browser didn't
              // have a chance of informing us about it yet, in that case send will
              // throw an error
              try {
                if (usingBrowserWebSocket) {
                  // TypeError is thrown when passing the second argument on Safari
                  self.ws.send(data);
                } else {
                  self.ws.send(data, opts);
                }
              } catch (e) {
                debug$2("websocket closed before onclose event");
              }

              --total || done();
            });
          })(packets[i]);
        }

        function done() {
          self.emit("flush");

          // fake drain
          // defer to next tick to allow Socket to clear writeBuffer
          setTimeout(function() {
            self.writable = true;
            self.emit("drain");
          }, 0);
        }
      }

      /**
       * Called upon close
       *
       * @api private
       */
      onClose() {
        transport.prototype.onClose.call(this);
      }

      /**
       * Closes socket.
       *
       * @api private
       */
      doClose() {
        if (typeof this.ws !== "undefined") {
          this.ws.close();
        }
      }

      /**
       * Generates uri for connection.
       *
       * @api private
       */
      uri() {
        let query = this.query || {};
        const schema = this.opts.secure ? "wss" : "ws";
        let port = "";

        // avoid port if default for schema
        if (
          this.opts.port &&
          (("wss" === schema && Number(this.opts.port) !== 443) ||
            ("ws" === schema && Number(this.opts.port) !== 80))
        ) {
          port = ":" + this.opts.port;
        }

        // append timestamp to URI
        if (this.opts.timestampRequests) {
          query[this.opts.timestampParam] = yeast_1();
        }

        // communicate binary support capabilities
        if (!this.supportsBinary) {
          query.b64 = 1;
        }

        query = parseqs.encode(query);

        // prepend ? to query
        if (query.length) {
          query = "?" + query;
        }

        const ipv6 = this.opts.hostname.indexOf(":") !== -1;
        return (
          schema +
          "://" +
          (ipv6 ? "[" + this.opts.hostname + "]" : this.opts.hostname) +
          port +
          this.opts.path +
          query
        );
      }

      /**
       * Feature detection for WebSocket.
       *
       * @return {Boolean} whether this transport is available.
       * @api public
       */
      check() {
        return (
          !!WebSocket &&
          !("__initialize" in WebSocket && this.name === WS.prototype.name)
        );
      }
    }

    var websocket = WS;

    var polling_1 = polling$1;
    var websocket_1 = websocket;

    /**
     * Polling transport polymorphic constructor.
     * Decides on xhr vs jsonp based on feature detection.
     *
     * @api private
     */

    function polling$1(opts) {
      let xhr;
      let xd = false;
      let xs = false;
      const jsonp = false !== opts.jsonp;

      if (typeof location !== "undefined") {
        const isSSL = "https:" === location.protocol;
        let port = location.port;

        // some user agents have empty `location.port`
        if (!port) {
          port = isSSL ? 443 : 80;
        }

        xd = opts.hostname !== location.hostname || port !== opts.port;
        xs = opts.secure !== isSSL;
      }

      opts.xdomain = xd;
      opts.xscheme = xs;
      xhr = new xmlhttprequest(opts);

      if ("open" in xhr && !opts.forceJSONP) {
        return new pollingXhr(opts);
      } else {
        if (!jsonp) throw new Error("JSONP disabled");
        return new pollingJsonp(opts);
      }
    }

    var transports = {
    	polling: polling_1,
    	websocket: websocket_1
    };

    const debug$3 = browser$1("engine.io-client:socket");




    class Socket extends componentEmitter {
      /**
       * Socket constructor.
       *
       * @param {String|Object} uri or options
       * @param {Object} options
       * @api public
       */
      constructor(uri, opts = {}) {
        super();

        if (uri && "object" === typeof uri) {
          opts = uri;
          uri = null;
        }

        if (uri) {
          uri = parseuri(uri);
          opts.hostname = uri.host;
          opts.secure = uri.protocol === "https" || uri.protocol === "wss";
          opts.port = uri.port;
          if (uri.query) opts.query = uri.query;
        } else if (opts.host) {
          opts.hostname = parseuri(opts.host).host;
        }

        this.secure =
          null != opts.secure
            ? opts.secure
            : typeof location !== "undefined" && "https:" === location.protocol;

        if (opts.hostname && !opts.port) {
          // if no port is specified manually, use the protocol default
          opts.port = this.secure ? "443" : "80";
        }

        this.hostname =
          opts.hostname ||
          (typeof location !== "undefined" ? location.hostname : "localhost");
        this.port =
          opts.port ||
          (typeof location !== "undefined" && location.port
            ? location.port
            : this.secure
            ? 443
            : 80);

        this.transports = opts.transports || ["polling", "websocket"];
        this.readyState = "";
        this.writeBuffer = [];
        this.prevBufferLen = 0;

        this.opts = Object.assign(
          {
            path: "/engine.io",
            agent: false,
            withCredentials: false,
            upgrade: true,
            jsonp: true,
            timestampParam: "t",
            rememberUpgrade: false,
            rejectUnauthorized: true,
            perMessageDeflate: {
              threshold: 1024
            },
            transportOptions: {}
          },
          opts
        );

        this.opts.path = this.opts.path.replace(/\/$/, "") + "/";

        if (typeof this.opts.query === "string") {
          this.opts.query = parseqs.decode(this.opts.query);
        }

        // set on handshake
        this.id = null;
        this.upgrades = null;
        this.pingInterval = null;
        this.pingTimeout = null;

        // set on heartbeat
        this.pingTimeoutTimer = null;

        this.open();
      }

      /**
       * Creates transport of the given type.
       *
       * @param {String} transport name
       * @return {Transport}
       * @api private
       */
      createTransport(name) {
        debug$3('creating transport "%s"', name);
        const query = clone(this.opts.query);

        // append engine.io protocol identifier
        query.EIO = lib.protocol;

        // transport name
        query.transport = name;

        // session id if we already have one
        if (this.id) query.sid = this.id;

        const opts = Object.assign(
          {},
          this.opts.transportOptions[name],
          this.opts,
          {
            query,
            socket: this,
            hostname: this.hostname,
            secure: this.secure,
            port: this.port
          }
        );

        debug$3("options: %j", opts);

        return new transports[name](opts);
      }

      /**
       * Initializes transport to use and starts probe.
       *
       * @api private
       */
      open() {
        let transport;
        if (
          this.opts.rememberUpgrade &&
          Socket.priorWebsocketSuccess &&
          this.transports.indexOf("websocket") !== -1
        ) {
          transport = "websocket";
        } else if (0 === this.transports.length) {
          // Emit error on next tick so it can be listened to
          const self = this;
          setTimeout(function() {
            self.emit("error", "No transports available");
          }, 0);
          return;
        } else {
          transport = this.transports[0];
        }
        this.readyState = "opening";

        // Retry with the next transport if the transport is disabled (jsonp: false)
        try {
          transport = this.createTransport(transport);
        } catch (e) {
          debug$3("error while creating transport: %s", e);
          this.transports.shift();
          this.open();
          return;
        }

        transport.open();
        this.setTransport(transport);
      }

      /**
       * Sets the current transport. Disables the existing one (if any).
       *
       * @api private
       */
      setTransport(transport) {
        debug$3("setting transport %s", transport.name);
        const self = this;

        if (this.transport) {
          debug$3("clearing existing transport %s", this.transport.name);
          this.transport.removeAllListeners();
        }

        // set up transport
        this.transport = transport;

        // set up transport listeners
        transport
          .on("drain", function() {
            self.onDrain();
          })
          .on("packet", function(packet) {
            self.onPacket(packet);
          })
          .on("error", function(e) {
            self.onError(e);
          })
          .on("close", function() {
            self.onClose("transport close");
          });
      }

      /**
       * Probes a transport.
       *
       * @param {String} transport name
       * @api private
       */
      probe(name) {
        debug$3('probing transport "%s"', name);
        let transport = this.createTransport(name, { probe: 1 });
        let failed = false;
        const self = this;

        Socket.priorWebsocketSuccess = false;

        function onTransportOpen() {
          if (self.onlyBinaryUpgrades) {
            const upgradeLosesBinary =
              !this.supportsBinary && self.transport.supportsBinary;
            failed = failed || upgradeLosesBinary;
          }
          if (failed) return;

          debug$3('probe transport "%s" opened', name);
          transport.send([{ type: "ping", data: "probe" }]);
          transport.once("packet", function(msg) {
            if (failed) return;
            if ("pong" === msg.type && "probe" === msg.data) {
              debug$3('probe transport "%s" pong', name);
              self.upgrading = true;
              self.emit("upgrading", transport);
              if (!transport) return;
              Socket.priorWebsocketSuccess = "websocket" === transport.name;

              debug$3('pausing current transport "%s"', self.transport.name);
              self.transport.pause(function() {
                if (failed) return;
                if ("closed" === self.readyState) return;
                debug$3("changing transport and sending upgrade packet");

                cleanup();

                self.setTransport(transport);
                transport.send([{ type: "upgrade" }]);
                self.emit("upgrade", transport);
                transport = null;
                self.upgrading = false;
                self.flush();
              });
            } else {
              debug$3('probe transport "%s" failed', name);
              const err = new Error("probe error");
              err.transport = transport.name;
              self.emit("upgradeError", err);
            }
          });
        }

        function freezeTransport() {
          if (failed) return;

          // Any callback called by transport should be ignored since now
          failed = true;

          cleanup();

          transport.close();
          transport = null;
        }

        // Handle any error that happens while probing
        function onerror(err) {
          const error = new Error("probe error: " + err);
          error.transport = transport.name;

          freezeTransport();

          debug$3('probe transport "%s" failed because of error: %s', name, err);

          self.emit("upgradeError", error);
        }

        function onTransportClose() {
          onerror("transport closed");
        }

        // When the socket is closed while we're probing
        function onclose() {
          onerror("socket closed");
        }

        // When the socket is upgraded while we're probing
        function onupgrade(to) {
          if (transport && to.name !== transport.name) {
            debug$3('"%s" works - aborting "%s"', to.name, transport.name);
            freezeTransport();
          }
        }

        // Remove all listeners on the transport and on self
        function cleanup() {
          transport.removeListener("open", onTransportOpen);
          transport.removeListener("error", onerror);
          transport.removeListener("close", onTransportClose);
          self.removeListener("close", onclose);
          self.removeListener("upgrading", onupgrade);
        }

        transport.once("open", onTransportOpen);
        transport.once("error", onerror);
        transport.once("close", onTransportClose);

        this.once("close", onclose);
        this.once("upgrading", onupgrade);

        transport.open();
      }

      /**
       * Called when connection is deemed open.
       *
       * @api public
       */
      onOpen() {
        debug$3("socket open");
        this.readyState = "open";
        Socket.priorWebsocketSuccess = "websocket" === this.transport.name;
        this.emit("open");
        this.flush();

        // we check for `readyState` in case an `open`
        // listener already closed the socket
        if (
          "open" === this.readyState &&
          this.opts.upgrade &&
          this.transport.pause
        ) {
          debug$3("starting upgrade probes");
          let i = 0;
          const l = this.upgrades.length;
          for (; i < l; i++) {
            this.probe(this.upgrades[i]);
          }
        }
      }

      /**
       * Handles a packet.
       *
       * @api private
       */
      onPacket(packet) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug$3('socket receive: type "%s", data "%s"', packet.type, packet.data);

          this.emit("packet", packet);

          // Socket is live - any packet counts
          this.emit("heartbeat");

          switch (packet.type) {
            case "open":
              this.onHandshake(JSON.parse(packet.data));
              break;

            case "ping":
              this.resetPingTimeout();
              this.sendPacket("pong");
              this.emit("pong");
              break;

            case "error":
              const err = new Error("server error");
              err.code = packet.data;
              this.onError(err);
              break;

            case "message":
              this.emit("data", packet.data);
              this.emit("message", packet.data);
              break;
          }
        } else {
          debug$3('packet received with socket readyState "%s"', this.readyState);
        }
      }

      /**
       * Called upon handshake completion.
       *
       * @param {Object} handshake obj
       * @api private
       */
      onHandshake(data) {
        this.emit("handshake", data);
        this.id = data.sid;
        this.transport.query.sid = data.sid;
        this.upgrades = this.filterUpgrades(data.upgrades);
        this.pingInterval = data.pingInterval;
        this.pingTimeout = data.pingTimeout;
        this.onOpen();
        // In case open handler closes socket
        if ("closed" === this.readyState) return;
        this.resetPingTimeout();
      }

      /**
       * Sets and resets ping timeout timer based on server pings.
       *
       * @api private
       */
      resetPingTimeout() {
        clearTimeout(this.pingTimeoutTimer);
        this.pingTimeoutTimer = setTimeout(() => {
          this.onClose("ping timeout");
        }, this.pingInterval + this.pingTimeout);
      }

      /**
       * Called on `drain` event
       *
       * @api private
       */
      onDrain() {
        this.writeBuffer.splice(0, this.prevBufferLen);

        // setting prevBufferLen = 0 is very important
        // for example, when upgrading, upgrade packet is sent over,
        // and a nonzero prevBufferLen could cause problems on `drain`
        this.prevBufferLen = 0;

        if (0 === this.writeBuffer.length) {
          this.emit("drain");
        } else {
          this.flush();
        }
      }

      /**
       * Flush write buffers.
       *
       * @api private
       */
      flush() {
        if (
          "closed" !== this.readyState &&
          this.transport.writable &&
          !this.upgrading &&
          this.writeBuffer.length
        ) {
          debug$3("flushing %d packets in socket", this.writeBuffer.length);
          this.transport.send(this.writeBuffer);
          // keep track of current length of writeBuffer
          // splice writeBuffer and callbackBuffer on `drain`
          this.prevBufferLen = this.writeBuffer.length;
          this.emit("flush");
        }
      }

      /**
       * Sends a message.
       *
       * @param {String} message.
       * @param {Function} callback function.
       * @param {Object} options.
       * @return {Socket} for chaining.
       * @api public
       */
      write(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      send(msg, options, fn) {
        this.sendPacket("message", msg, options, fn);
        return this;
      }

      /**
       * Sends a packet.
       *
       * @param {String} packet type.
       * @param {String} data.
       * @param {Object} options.
       * @param {Function} callback function.
       * @api private
       */
      sendPacket(type, data, options, fn) {
        if ("function" === typeof data) {
          fn = data;
          data = undefined;
        }

        if ("function" === typeof options) {
          fn = options;
          options = null;
        }

        if ("closing" === this.readyState || "closed" === this.readyState) {
          return;
        }

        options = options || {};
        options.compress = false !== options.compress;

        const packet = {
          type: type,
          data: data,
          options: options
        };
        this.emit("packetCreate", packet);
        this.writeBuffer.push(packet);
        if (fn) this.once("flush", fn);
        this.flush();
      }

      /**
       * Closes the connection.
       *
       * @api private
       */
      close() {
        const self = this;

        if ("opening" === this.readyState || "open" === this.readyState) {
          this.readyState = "closing";

          if (this.writeBuffer.length) {
            this.once("drain", function() {
              if (this.upgrading) {
                waitForUpgrade();
              } else {
                close();
              }
            });
          } else if (this.upgrading) {
            waitForUpgrade();
          } else {
            close();
          }
        }

        function close() {
          self.onClose("forced close");
          debug$3("socket closing - telling transport to close");
          self.transport.close();
        }

        function cleanupAndClose() {
          self.removeListener("upgrade", cleanupAndClose);
          self.removeListener("upgradeError", cleanupAndClose);
          close();
        }

        function waitForUpgrade() {
          // wait for upgrade to finish since we can't send packets while pausing a transport
          self.once("upgrade", cleanupAndClose);
          self.once("upgradeError", cleanupAndClose);
        }

        return this;
      }

      /**
       * Called upon transport error
       *
       * @api private
       */
      onError(err) {
        debug$3("socket error %j", err);
        Socket.priorWebsocketSuccess = false;
        this.emit("error", err);
        this.onClose("transport error", err);
      }

      /**
       * Called upon transport close.
       *
       * @api private
       */
      onClose(reason, desc) {
        if (
          "opening" === this.readyState ||
          "open" === this.readyState ||
          "closing" === this.readyState
        ) {
          debug$3('socket close with reason: "%s"', reason);
          const self = this;

          // clear timers
          clearTimeout(this.pingIntervalTimer);
          clearTimeout(this.pingTimeoutTimer);

          // stop event from firing again for transport
          this.transport.removeAllListeners("close");

          // ensure transport won't stay open
          this.transport.close();

          // ignore further transport communication
          this.transport.removeAllListeners();

          // set ready state
          this.readyState = "closed";

          // clear session id
          this.id = null;

          // emit close event
          this.emit("close", reason, desc);

          // clean buffers after, so users can still
          // grab the buffers on `close` event
          self.writeBuffer = [];
          self.prevBufferLen = 0;
        }
      }

      /**
       * Filters upgrades, returning only those matching client transports.
       *
       * @param {Array} server upgrades
       * @api private
       *
       */
      filterUpgrades(upgrades) {
        const filteredUpgrades = [];
        let i = 0;
        const j = upgrades.length;
        for (; i < j; i++) {
          if (~this.transports.indexOf(upgrades[i]))
            filteredUpgrades.push(upgrades[i]);
        }
        return filteredUpgrades;
      }
    }

    Socket.priorWebsocketSuccess = false;

    /**
     * Protocol version.
     *
     * @api public
     */

    Socket.protocol = lib.protocol; // this is an int

    function clone(obj) {
      const o = {};
      for (let i in obj) {
        if (obj.hasOwnProperty(i)) {
          o[i] = obj[i];
        }
      }
      return o;
    }

    var socket = Socket;

    var lib$1 = (uri, opts) => new socket(uri, opts);

    /**
     * Expose deps for legacy compatibility
     * and standalone browser access.
     */

    var Socket_1 = socket;
    var protocol = socket.protocol; // this is an int
    var Transport$1 = transport;
    var transports$1 = transports;
    var parser = lib;
    lib$1.Socket = Socket_1;
    lib$1.protocol = protocol;
    lib$1.Transport = Transport$1;
    lib$1.transports = transports$1;
    lib$1.parser = parser;

    var isBinary_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hasBinary = exports.isBinary = void 0;
    const withNativeArrayBuffer = typeof ArrayBuffer === "function";
    const isView = (obj) => {
        return typeof ArrayBuffer.isView === "function"
            ? ArrayBuffer.isView(obj)
            : obj.buffer instanceof ArrayBuffer;
    };
    const toString = Object.prototype.toString;
    const withNativeBlob = typeof Blob === "function" ||
        (typeof Blob !== "undefined" &&
            toString.call(Blob) === "[object BlobConstructor]");
    const withNativeFile = typeof File === "function" ||
        (typeof File !== "undefined" &&
            toString.call(File) === "[object FileConstructor]");
    /**
     * Returns true if obj is a Buffer, an ArrayBuffer, a Blob or a File.
     *
     * @private
     */
    function isBinary(obj) {
        return ((withNativeArrayBuffer && (obj instanceof ArrayBuffer || isView(obj))) ||
            (withNativeBlob && obj instanceof Blob) ||
            (withNativeFile && obj instanceof File));
    }
    exports.isBinary = isBinary;
    function hasBinary(obj, toJSON) {
        if (!obj || typeof obj !== "object") {
            return false;
        }
        if (Array.isArray(obj)) {
            for (let i = 0, l = obj.length; i < l; i++) {
                if (hasBinary(obj[i])) {
                    return true;
                }
            }
            return false;
        }
        if (isBinary(obj)) {
            return true;
        }
        if (obj.toJSON &&
            typeof obj.toJSON === "function" &&
            arguments.length === 1) {
            return hasBinary(obj.toJSON(), true);
        }
        for (const key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key) && hasBinary(obj[key])) {
                return true;
            }
        }
        return false;
    }
    exports.hasBinary = hasBinary;
    });

    var binary = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.reconstructPacket = exports.deconstructPacket = void 0;

    /**
     * Replaces every Buffer | ArrayBuffer | Blob | File in packet with a numbered placeholder.
     *
     * @param {Object} packet - socket.io event packet
     * @return {Object} with deconstructed packet and list of buffers
     * @public
     */
    function deconstructPacket(packet) {
        const buffers = [];
        const packetData = packet.data;
        const pack = packet;
        pack.data = _deconstructPacket(packetData, buffers);
        pack.attachments = buffers.length; // number of binary 'attachments'
        return { packet: pack, buffers: buffers };
    }
    exports.deconstructPacket = deconstructPacket;
    function _deconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (isBinary_1.isBinary(data)) {
            const placeholder = { _placeholder: true, num: buffers.length };
            buffers.push(data);
            return placeholder;
        }
        else if (Array.isArray(data)) {
            const newData = new Array(data.length);
            for (let i = 0; i < data.length; i++) {
                newData[i] = _deconstructPacket(data[i], buffers);
            }
            return newData;
        }
        else if (typeof data === "object" && !(data instanceof Date)) {
            const newData = {};
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    newData[key] = _deconstructPacket(data[key], buffers);
                }
            }
            return newData;
        }
        return data;
    }
    /**
     * Reconstructs a binary packet from its placeholder packet and buffers
     *
     * @param {Object} packet - event packet with placeholders
     * @param {Array} buffers - binary buffers to put in placeholder positions
     * @return {Object} reconstructed packet
     * @public
     */
    function reconstructPacket(packet, buffers) {
        packet.data = _reconstructPacket(packet.data, buffers);
        packet.attachments = undefined; // no longer useful
        return packet;
    }
    exports.reconstructPacket = reconstructPacket;
    function _reconstructPacket(data, buffers) {
        if (!data)
            return data;
        if (data && data._placeholder) {
            return buffers[data.num]; // appropriate buffer (should be natural order anyway)
        }
        else if (Array.isArray(data)) {
            for (let i = 0; i < data.length; i++) {
                data[i] = _reconstructPacket(data[i], buffers);
            }
        }
        else if (typeof data === "object") {
            for (const key in data) {
                if (data.hasOwnProperty(key)) {
                    data[key] = _reconstructPacket(data[key], buffers);
                }
            }
        }
        return data;
    }
    });

    /**
     * Helpers.
     */
    var s$2 = 1000;
    var m$2 = s$2 * 60;
    var h$2 = m$2 * 60;
    var d$2 = h$2 * 24;
    var w$2 = d$2 * 7;
    var y$2 = d$2 * 365.25;

    /**
     * Parse or format the given `val`.
     *
     * Options:
     *
     *  - `long` verbose formatting [false]
     *
     * @param {String|Number} val
     * @param {Object} [options]
     * @throws {Error} throw an error if val is not a non-empty string or a number
     * @return {String|Number}
     * @api public
     */

    var ms$2 = function(val, options) {
      options = options || {};
      var type = typeof val;
      if (type === 'string' && val.length > 0) {
        return parse$2(val);
      } else if (type === 'number' && isFinite(val)) {
        return options.long ? fmtLong$2(val) : fmtShort$2(val);
      }
      throw new Error(
        'val is not a non-empty string or a valid number. val=' +
          JSON.stringify(val)
      );
    };

    /**
     * Parse the given `str` and return milliseconds.
     *
     * @param {String} str
     * @return {Number}
     * @api private
     */

    function parse$2(str) {
      str = String(str);
      if (str.length > 100) {
        return;
      }
      var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
        str
      );
      if (!match) {
        return;
      }
      var n = parseFloat(match[1]);
      var type = (match[2] || 'ms').toLowerCase();
      switch (type) {
        case 'years':
        case 'year':
        case 'yrs':
        case 'yr':
        case 'y':
          return n * y$2;
        case 'weeks':
        case 'week':
        case 'w':
          return n * w$2;
        case 'days':
        case 'day':
        case 'd':
          return n * d$2;
        case 'hours':
        case 'hour':
        case 'hrs':
        case 'hr':
        case 'h':
          return n * h$2;
        case 'minutes':
        case 'minute':
        case 'mins':
        case 'min':
        case 'm':
          return n * m$2;
        case 'seconds':
        case 'second':
        case 'secs':
        case 'sec':
        case 's':
          return n * s$2;
        case 'milliseconds':
        case 'millisecond':
        case 'msecs':
        case 'msec':
        case 'ms':
          return n;
        default:
          return undefined;
      }
    }

    /**
     * Short format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtShort$2(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$2) {
        return Math.round(ms / d$2) + 'd';
      }
      if (msAbs >= h$2) {
        return Math.round(ms / h$2) + 'h';
      }
      if (msAbs >= m$2) {
        return Math.round(ms / m$2) + 'm';
      }
      if (msAbs >= s$2) {
        return Math.round(ms / s$2) + 's';
      }
      return ms + 'ms';
    }

    /**
     * Long format for `ms`.
     *
     * @param {Number} ms
     * @return {String}
     * @api private
     */

    function fmtLong$2(ms) {
      var msAbs = Math.abs(ms);
      if (msAbs >= d$2) {
        return plural$2(ms, msAbs, d$2, 'day');
      }
      if (msAbs >= h$2) {
        return plural$2(ms, msAbs, h$2, 'hour');
      }
      if (msAbs >= m$2) {
        return plural$2(ms, msAbs, m$2, 'minute');
      }
      if (msAbs >= s$2) {
        return plural$2(ms, msAbs, s$2, 'second');
      }
      return ms + ' ms';
    }

    /**
     * Pluralization helper.
     */

    function plural$2(ms, msAbs, n, name) {
      var isPlural = msAbs >= n * 1.5;
      return Math.round(ms / n) + ' ' + name + (isPlural ? 's' : '');
    }

    /**
     * This is the common logic for both the Node.js and web browser
     * implementations of `debug()`.
     */

    function setup$2(env) {
    	createDebug.debug = createDebug;
    	createDebug.default = createDebug;
    	createDebug.coerce = coerce;
    	createDebug.disable = disable;
    	createDebug.enable = enable;
    	createDebug.enabled = enabled;
    	createDebug.humanize = ms$2;
    	createDebug.destroy = destroy;

    	Object.keys(env).forEach(key => {
    		createDebug[key] = env[key];
    	});

    	/**
    	* The currently active debug mode names, and names to skip.
    	*/

    	createDebug.names = [];
    	createDebug.skips = [];

    	/**
    	* Map of special "%n" handling functions, for the debug "format" argument.
    	*
    	* Valid key names are a single, lower or upper-case letter, i.e. "n" and "N".
    	*/
    	createDebug.formatters = {};

    	/**
    	* Selects a color for a debug namespace
    	* @param {String} namespace The namespace string for the for the debug instance to be colored
    	* @return {Number|String} An ANSI color code for the given namespace
    	* @api private
    	*/
    	function selectColor(namespace) {
    		let hash = 0;

    		for (let i = 0; i < namespace.length; i++) {
    			hash = ((hash << 5) - hash) + namespace.charCodeAt(i);
    			hash |= 0; // Convert to 32bit integer
    		}

    		return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    	}
    	createDebug.selectColor = selectColor;

    	/**
    	* Create a debugger with the given `namespace`.
    	*
    	* @param {String} namespace
    	* @return {Function}
    	* @api public
    	*/
    	function createDebug(namespace) {
    		let prevTime;
    		let enableOverride = null;

    		function debug(...args) {
    			// Disabled?
    			if (!debug.enabled) {
    				return;
    			}

    			const self = debug;

    			// Set `diff` timestamp
    			const curr = Number(new Date());
    			const ms = curr - (prevTime || curr);
    			self.diff = ms;
    			self.prev = prevTime;
    			self.curr = curr;
    			prevTime = curr;

    			args[0] = createDebug.coerce(args[0]);

    			if (typeof args[0] !== 'string') {
    				// Anything else let's inspect with %O
    				args.unshift('%O');
    			}

    			// Apply any `formatters` transformations
    			let index = 0;
    			args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
    				// If we encounter an escaped % then don't increase the array index
    				if (match === '%%') {
    					return '%';
    				}
    				index++;
    				const formatter = createDebug.formatters[format];
    				if (typeof formatter === 'function') {
    					const val = args[index];
    					match = formatter.call(self, val);

    					// Now we need to remove `args[index]` since it's inlined in the `format`
    					args.splice(index, 1);
    					index--;
    				}
    				return match;
    			});

    			// Apply env-specific formatting (colors, etc.)
    			createDebug.formatArgs.call(self, args);

    			const logFn = self.log || createDebug.log;
    			logFn.apply(self, args);
    		}

    		debug.namespace = namespace;
    		debug.useColors = createDebug.useColors();
    		debug.color = createDebug.selectColor(namespace);
    		debug.extend = extend;
    		debug.destroy = createDebug.destroy; // XXX Temporary. Will be removed in the next major release.

    		Object.defineProperty(debug, 'enabled', {
    			enumerable: true,
    			configurable: false,
    			get: () => enableOverride === null ? createDebug.enabled(namespace) : enableOverride,
    			set: v => {
    				enableOverride = v;
    			}
    		});

    		// Env-specific initialization logic for debug instances
    		if (typeof createDebug.init === 'function') {
    			createDebug.init(debug);
    		}

    		return debug;
    	}

    	function extend(namespace, delimiter) {
    		const newDebug = createDebug(this.namespace + (typeof delimiter === 'undefined' ? ':' : delimiter) + namespace);
    		newDebug.log = this.log;
    		return newDebug;
    	}

    	/**
    	* Enables a debug mode by namespaces. This can include modes
    	* separated by a colon and wildcards.
    	*
    	* @param {String} namespaces
    	* @api public
    	*/
    	function enable(namespaces) {
    		createDebug.save(namespaces);

    		createDebug.names = [];
    		createDebug.skips = [];

    		let i;
    		const split = (typeof namespaces === 'string' ? namespaces : '').split(/[\s,]+/);
    		const len = split.length;

    		for (i = 0; i < len; i++) {
    			if (!split[i]) {
    				// ignore empty strings
    				continue;
    			}

    			namespaces = split[i].replace(/\*/g, '.*?');

    			if (namespaces[0] === '-') {
    				createDebug.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    			} else {
    				createDebug.names.push(new RegExp('^' + namespaces + '$'));
    			}
    		}
    	}

    	/**
    	* Disable debug output.
    	*
    	* @return {String} namespaces
    	* @api public
    	*/
    	function disable() {
    		const namespaces = [
    			...createDebug.names.map(toNamespace),
    			...createDebug.skips.map(toNamespace).map(namespace => '-' + namespace)
    		].join(',');
    		createDebug.enable('');
    		return namespaces;
    	}

    	/**
    	* Returns true if the given mode name is enabled, false otherwise.
    	*
    	* @param {String} name
    	* @return {Boolean}
    	* @api public
    	*/
    	function enabled(name) {
    		if (name[name.length - 1] === '*') {
    			return true;
    		}

    		let i;
    		let len;

    		for (i = 0, len = createDebug.skips.length; i < len; i++) {
    			if (createDebug.skips[i].test(name)) {
    				return false;
    			}
    		}

    		for (i = 0, len = createDebug.names.length; i < len; i++) {
    			if (createDebug.names[i].test(name)) {
    				return true;
    			}
    		}

    		return false;
    	}

    	/**
    	* Convert regexp to namespace
    	*
    	* @param {RegExp} regxep
    	* @return {String} namespace
    	* @api private
    	*/
    	function toNamespace(regexp) {
    		return regexp.toString()
    			.substring(2, regexp.toString().length - 2)
    			.replace(/\.\*\?$/, '*');
    	}

    	/**
    	* Coerce `val`.
    	*
    	* @param {Mixed} val
    	* @return {Mixed}
    	* @api private
    	*/
    	function coerce(val) {
    		if (val instanceof Error) {
    			return val.stack || val.message;
    		}
    		return val;
    	}

    	/**
    	* XXX DO NOT USE. This is a temporary stub function.
    	* XXX It WILL be removed in the next major release.
    	*/
    	function destroy() {
    		console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    	}

    	createDebug.enable(createDebug.load());

    	return createDebug;
    }

    var common$2 = setup$2;

    /* eslint-env browser */

    var browser$2 = createCommonjsModule(function (module, exports) {
    /**
     * This is the web browser implementation of `debug()`.
     */

    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = (() => {
    	let warned = false;

    	return () => {
    		if (!warned) {
    			warned = true;
    			console.warn('Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.');
    		}
    	};
    })();

    /**
     * Colors.
     */

    exports.colors = [
    	'#0000CC',
    	'#0000FF',
    	'#0033CC',
    	'#0033FF',
    	'#0066CC',
    	'#0066FF',
    	'#0099CC',
    	'#0099FF',
    	'#00CC00',
    	'#00CC33',
    	'#00CC66',
    	'#00CC99',
    	'#00CCCC',
    	'#00CCFF',
    	'#3300CC',
    	'#3300FF',
    	'#3333CC',
    	'#3333FF',
    	'#3366CC',
    	'#3366FF',
    	'#3399CC',
    	'#3399FF',
    	'#33CC00',
    	'#33CC33',
    	'#33CC66',
    	'#33CC99',
    	'#33CCCC',
    	'#33CCFF',
    	'#6600CC',
    	'#6600FF',
    	'#6633CC',
    	'#6633FF',
    	'#66CC00',
    	'#66CC33',
    	'#9900CC',
    	'#9900FF',
    	'#9933CC',
    	'#9933FF',
    	'#99CC00',
    	'#99CC33',
    	'#CC0000',
    	'#CC0033',
    	'#CC0066',
    	'#CC0099',
    	'#CC00CC',
    	'#CC00FF',
    	'#CC3300',
    	'#CC3333',
    	'#CC3366',
    	'#CC3399',
    	'#CC33CC',
    	'#CC33FF',
    	'#CC6600',
    	'#CC6633',
    	'#CC9900',
    	'#CC9933',
    	'#CCCC00',
    	'#CCCC33',
    	'#FF0000',
    	'#FF0033',
    	'#FF0066',
    	'#FF0099',
    	'#FF00CC',
    	'#FF00FF',
    	'#FF3300',
    	'#FF3333',
    	'#FF3366',
    	'#FF3399',
    	'#FF33CC',
    	'#FF33FF',
    	'#FF6600',
    	'#FF6633',
    	'#FF9900',
    	'#FF9933',
    	'#FFCC00',
    	'#FFCC33'
    ];

    /**
     * Currently only WebKit-based Web Inspectors, Firefox >= v31,
     * and the Firebug extension (any Firefox version) are known
     * to support "%c" CSS customizations.
     *
     * TODO: add a `localStorage` variable to explicitly enable/disable colors
     */

    // eslint-disable-next-line complexity
    function useColors() {
    	// NB: In an Electron preload script, document will be defined but not fully
    	// initialized. Since we know we're in Chrome, we'll just detect this case
    	// explicitly
    	if (typeof window !== 'undefined' && window.process && (window.process.type === 'renderer' || window.process.__nwjs)) {
    		return true;
    	}

    	// Internet Explorer and Edge do not support colors.
    	if (typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
    		return false;
    	}

    	// Is webkit? http://stackoverflow.com/a/16459606/376773
    	// document is undefined in react-native: https://github.com/facebook/react-native/pull/1632
    	return (typeof document !== 'undefined' && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance) ||
    		// Is firebug? http://stackoverflow.com/a/398120/376773
    		(typeof window !== 'undefined' && window.console && (window.console.firebug || (window.console.exception && window.console.table))) ||
    		// Is firefox >= v31?
    		// https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31) ||
    		// Double check webkit in userAgent just in case we are in a worker
    		(typeof navigator !== 'undefined' && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/));
    }

    /**
     * Colorize log arguments if enabled.
     *
     * @api public
     */

    function formatArgs(args) {
    	args[0] = (this.useColors ? '%c' : '') +
    		this.namespace +
    		(this.useColors ? ' %c' : ' ') +
    		args[0] +
    		(this.useColors ? '%c ' : ' ') +
    		'+' + module.exports.humanize(this.diff);

    	if (!this.useColors) {
    		return;
    	}

    	const c = 'color: ' + this.color;
    	args.splice(1, 0, c, 'color: inherit');

    	// The final "%c" is somewhat tricky, because there could be other
    	// arguments passed either before or after the %c, so we need to
    	// figure out the correct index to insert the CSS into
    	let index = 0;
    	let lastC = 0;
    	args[0].replace(/%[a-zA-Z%]/g, match => {
    		if (match === '%%') {
    			return;
    		}
    		index++;
    		if (match === '%c') {
    			// We only are interested in the *last* %c
    			// (the user may have provided their own)
    			lastC = index;
    		}
    	});

    	args.splice(lastC, 0, c);
    }

    /**
     * Invokes `console.debug()` when available.
     * No-op when `console.debug` is not a "function".
     * If `console.debug` is not available, falls back
     * to `console.log`.
     *
     * @api public
     */
    exports.log = console.debug || console.log || (() => {});

    /**
     * Save `namespaces`.
     *
     * @param {String} namespaces
     * @api private
     */
    function save(namespaces) {
    	try {
    		if (namespaces) {
    			exports.storage.setItem('debug', namespaces);
    		} else {
    			exports.storage.removeItem('debug');
    		}
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    /**
     * Load `namespaces`.
     *
     * @return {String} returns the previously persisted debug modes
     * @api private
     */
    function load() {
    	let r;
    	try {
    		r = exports.storage.getItem('debug');
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}

    	// If debug isn't set in LS, and we're in Electron, try to load $DEBUG
    	if (!r && typeof process !== 'undefined' && 'env' in process) {
    		r = process.env.DEBUG;
    	}

    	return r;
    }

    /**
     * Localstorage attempts to return the localstorage.
     *
     * This is necessary because safari throws
     * when a user disables cookies/localstorage
     * and you attempt to access it.
     *
     * @return {LocalStorage}
     * @api private
     */

    function localstorage() {
    	try {
    		// TVMLKit (Apple TV JS Runtime) does not have a window object, just localStorage in the global context
    		// The Browser also has localStorage in the global context.
    		return localStorage;
    	} catch (error) {
    		// Swallow
    		// XXX (@Qix-) should we be logging these?
    	}
    }

    module.exports = common$2(exports);

    const {formatters} = module.exports;

    /**
     * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
     */

    formatters.j = function (v) {
    	try {
    		return JSON.stringify(v);
    	} catch (error) {
    		return '[UnexpectedJSONParseError]: ' + error.message;
    	}
    };
    });

    var dist = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Decoder = exports.Encoder = exports.PacketType = exports.protocol = void 0;



    const debug = browser$2("socket.io-parser");
    /**
     * Protocol version.
     *
     * @public
     */
    exports.protocol = 5;
    var PacketType;
    (function (PacketType) {
        PacketType[PacketType["CONNECT"] = 0] = "CONNECT";
        PacketType[PacketType["DISCONNECT"] = 1] = "DISCONNECT";
        PacketType[PacketType["EVENT"] = 2] = "EVENT";
        PacketType[PacketType["ACK"] = 3] = "ACK";
        PacketType[PacketType["CONNECT_ERROR"] = 4] = "CONNECT_ERROR";
        PacketType[PacketType["BINARY_EVENT"] = 5] = "BINARY_EVENT";
        PacketType[PacketType["BINARY_ACK"] = 6] = "BINARY_ACK";
    })(PacketType = exports.PacketType || (exports.PacketType = {}));
    /**
     * A socket.io Encoder instance
     */
    class Encoder {
        /**
         * Encode a packet as a single string if non-binary, or as a
         * buffer sequence, depending on packet type.
         *
         * @param {Object} obj - packet object
         */
        encode(obj) {
            debug("encoding packet %j", obj);
            if (obj.type === PacketType.EVENT || obj.type === PacketType.ACK) {
                if (isBinary_1.hasBinary(obj)) {
                    obj.type =
                        obj.type === PacketType.EVENT
                            ? PacketType.BINARY_EVENT
                            : PacketType.BINARY_ACK;
                    return this.encodeAsBinary(obj);
                }
            }
            return [this.encodeAsString(obj)];
        }
        /**
         * Encode packet as string.
         */
        encodeAsString(obj) {
            // first is type
            let str = "" + obj.type;
            // attachments if we have them
            if (obj.type === PacketType.BINARY_EVENT ||
                obj.type === PacketType.BINARY_ACK) {
                str += obj.attachments + "-";
            }
            // if we have a namespace other than `/`
            // we append it followed by a comma `,`
            if (obj.nsp && "/" !== obj.nsp) {
                str += obj.nsp + ",";
            }
            // immediately followed by the id
            if (null != obj.id) {
                str += obj.id;
            }
            // json data
            if (null != obj.data) {
                str += JSON.stringify(obj.data);
            }
            debug("encoded %j as %s", obj, str);
            return str;
        }
        /**
         * Encode packet as 'buffer sequence' by removing blobs, and
         * deconstructing packet into object with placeholders and
         * a list of buffers.
         */
        encodeAsBinary(obj) {
            const deconstruction = binary.deconstructPacket(obj);
            const pack = this.encodeAsString(deconstruction.packet);
            const buffers = deconstruction.buffers;
            buffers.unshift(pack); // add packet info to beginning of data list
            return buffers; // write all the buffers
        }
    }
    exports.Encoder = Encoder;
    /**
     * A socket.io Decoder instance
     *
     * @return {Object} decoder
     */
    class Decoder extends componentEmitter {
        constructor() {
            super();
        }
        /**
         * Decodes an encoded packet string into packet JSON.
         *
         * @param {String} obj - encoded packet
         */
        add(obj) {
            let packet;
            if (typeof obj === "string") {
                packet = this.decodeString(obj);
                if (packet.type === PacketType.BINARY_EVENT ||
                    packet.type === PacketType.BINARY_ACK) {
                    // binary packet's json
                    this.reconstructor = new BinaryReconstructor(packet);
                    // no attachments, labeled binary but no binary data to follow
                    if (packet.attachments === 0) {
                        super.emit("decoded", packet);
                    }
                }
                else {
                    // non-binary full packet
                    super.emit("decoded", packet);
                }
            }
            else if (isBinary_1.isBinary(obj) || obj.base64) {
                // raw binary data
                if (!this.reconstructor) {
                    throw new Error("got binary data when not reconstructing a packet");
                }
                else {
                    packet = this.reconstructor.takeBinaryData(obj);
                    if (packet) {
                        // received final buffer
                        this.reconstructor = null;
                        super.emit("decoded", packet);
                    }
                }
            }
            else {
                throw new Error("Unknown type: " + obj);
            }
        }
        /**
         * Decode a packet String (JSON data)
         *
         * @param {String} str
         * @return {Object} packet
         */
        decodeString(str) {
            let i = 0;
            // look up type
            const p = {
                type: Number(str.charAt(0)),
            };
            if (PacketType[p.type] === undefined) {
                throw new Error("unknown packet type " + p.type);
            }
            // look up attachments if type binary
            if (p.type === PacketType.BINARY_EVENT ||
                p.type === PacketType.BINARY_ACK) {
                const start = i + 1;
                while (str.charAt(++i) !== "-" && i != str.length) { }
                const buf = str.substring(start, i);
                if (buf != Number(buf) || str.charAt(i) !== "-") {
                    throw new Error("Illegal attachments");
                }
                p.attachments = Number(buf);
            }
            // look up namespace (if any)
            if ("/" === str.charAt(i + 1)) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if ("," === c)
                        break;
                    if (i === str.length)
                        break;
                }
                p.nsp = str.substring(start, i);
            }
            else {
                p.nsp = "/";
            }
            // look up id
            const next = str.charAt(i + 1);
            if ("" !== next && Number(next) == next) {
                const start = i + 1;
                while (++i) {
                    const c = str.charAt(i);
                    if (null == c || Number(c) != c) {
                        --i;
                        break;
                    }
                    if (i === str.length)
                        break;
                }
                p.id = Number(str.substring(start, i + 1));
            }
            // look up json data
            if (str.charAt(++i)) {
                const payload = tryParse(str.substr(i));
                if (Decoder.isPayloadValid(p.type, payload)) {
                    p.data = payload;
                }
                else {
                    throw new Error("invalid payload");
                }
            }
            debug("decoded %s as %j", str, p);
            return p;
        }
        static isPayloadValid(type, payload) {
            switch (type) {
                case PacketType.CONNECT:
                    return typeof payload === "object";
                case PacketType.DISCONNECT:
                    return payload === undefined;
                case PacketType.CONNECT_ERROR:
                    return typeof payload === "string" || typeof payload === "object";
                case PacketType.EVENT:
                case PacketType.BINARY_EVENT:
                    return Array.isArray(payload) && payload.length > 0;
                case PacketType.ACK:
                case PacketType.BINARY_ACK:
                    return Array.isArray(payload);
            }
        }
        /**
         * Deallocates a parser's resources
         */
        destroy() {
            if (this.reconstructor) {
                this.reconstructor.finishedReconstruction();
            }
        }
    }
    exports.Decoder = Decoder;
    function tryParse(str) {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            return false;
        }
    }
    /**
     * A manager of a binary event's 'buffer sequence'. Should
     * be constructed whenever a packet of type BINARY_EVENT is
     * decoded.
     *
     * @param {Object} packet
     * @return {BinaryReconstructor} initialized reconstructor
     */
    class BinaryReconstructor {
        constructor(packet) {
            this.packet = packet;
            this.buffers = [];
            this.reconPack = packet;
        }
        /**
         * Method to be called when binary data received from connection
         * after a BINARY_EVENT packet.
         *
         * @param {Buffer | ArrayBuffer} binData - the raw binary data received
         * @return {null | Object} returns null if more binary data is expected or
         *   a reconstructed packet object if all buffers have been received.
         */
        takeBinaryData(binData) {
            this.buffers.push(binData);
            if (this.buffers.length === this.reconPack.attachments) {
                // done with buffer list
                const packet = binary.reconstructPacket(this.reconPack, this.buffers);
                this.finishedReconstruction();
                return packet;
            }
            return null;
        }
        /**
         * Cleans up binary packet reconstruction variables.
         */
        finishedReconstruction() {
            this.reconPack = null;
            this.buffers = [];
        }
    }
    });

    var on_1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.on = void 0;
    function on(obj, ev, fn) {
        obj.on(ev, fn);
        return function subDestroy() {
            obj.off(ev, fn);
        };
    }
    exports.on = on;
    });

    var socket$1 = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Socket = void 0;



    const debug = browser("socket.io-client:socket");
    /**
     * Internal events.
     * These events can't be emitted by the user.
     */
    const RESERVED_EVENTS = Object.freeze({
        connect: 1,
        connect_error: 1,
        disconnect: 1,
        disconnecting: 1,
        // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
        newListener: 1,
        removeListener: 1,
    });
    class Socket extends componentEmitter {
        /**
         * `Socket` constructor.
         *
         * @public
         */
        constructor(io, nsp, opts) {
            super();
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.ids = 0;
            this.acks = {};
            this.flags = {};
            this.io = io;
            this.nsp = nsp;
            this.ids = 0;
            this.acks = {};
            this.receiveBuffer = [];
            this.sendBuffer = [];
            this.connected = false;
            this.disconnected = true;
            this.flags = {};
            if (opts && opts.auth) {
                this.auth = opts.auth;
            }
            if (this.io._autoConnect)
                this.open();
        }
        /**
         * Subscribe to open, close and packet events
         *
         * @private
         */
        subEvents() {
            if (this.subs)
                return;
            const io = this.io;
            this.subs = [
                on_1.on(io, "open", this.onopen.bind(this)),
                on_1.on(io, "packet", this.onpacket.bind(this)),
                on_1.on(io, "error", this.onerror.bind(this)),
                on_1.on(io, "close", this.onclose.bind(this)),
            ];
        }
        /**
         * Whether the Socket will try to reconnect when its Manager connects or reconnects
         */
        get active() {
            return !!this.subs;
        }
        /**
         * "Opens" the socket.
         *
         * @public
         */
        connect() {
            if (this.connected)
                return this;
            this.subEvents();
            if (!this.io["_reconnecting"])
                this.io.open(); // ensure open
            if ("open" === this.io._readyState)
                this.onopen();
            return this;
        }
        /**
         * Alias for connect()
         */
        open() {
            return this.connect();
        }
        /**
         * Sends a `message` event.
         *
         * @return self
         * @public
         */
        send(...args) {
            args.unshift("message");
            this.emit.apply(this, args);
            return this;
        }
        /**
         * Override `emit`.
         * If the event is in `events`, it's emitted normally.
         *
         * @param ev - event name
         * @return self
         * @public
         */
        emit(ev, ...args) {
            if (RESERVED_EVENTS.hasOwnProperty(ev)) {
                throw new Error('"' + ev + '" is a reserved event name');
            }
            args.unshift(ev);
            const packet = {
                type: dist.PacketType.EVENT,
                data: args,
            };
            packet.options = {};
            packet.options.compress = this.flags.compress !== false;
            // event ack callback
            if ("function" === typeof args[args.length - 1]) {
                debug("emitting packet with ack id %d", this.ids);
                this.acks[this.ids] = args.pop();
                packet.id = this.ids++;
            }
            const isTransportWritable = this.io.engine &&
                this.io.engine.transport &&
                this.io.engine.transport.writable;
            const discardPacket = this.flags.volatile && (!isTransportWritable || !this.connected);
            if (discardPacket) {
                debug("discard packet as the transport is not currently writable");
            }
            else if (this.connected) {
                this.packet(packet);
            }
            else {
                this.sendBuffer.push(packet);
            }
            this.flags = {};
            return this;
        }
        /**
         * Sends a packet.
         *
         * @param packet
         * @private
         */
        packet(packet) {
            packet.nsp = this.nsp;
            this.io._packet(packet);
        }
        /**
         * Called upon engine `open`.
         *
         * @private
         */
        onopen() {
            debug("transport is open - connecting");
            if (typeof this.auth == "function") {
                this.auth((data) => {
                    this.packet({ type: dist.PacketType.CONNECT, data });
                });
            }
            else {
                this.packet({ type: dist.PacketType.CONNECT, data: this.auth });
            }
        }
        /**
         * Called upon engine or manager `error`.
         *
         * @param err
         * @private
         */
        onerror(err) {
            if (!this.connected) {
                super.emit("connect_error", err);
            }
        }
        /**
         * Called upon engine `close`.
         *
         * @param reason
         * @private
         */
        onclose(reason) {
            debug("close (%s)", reason);
            this.connected = false;
            this.disconnected = true;
            delete this.id;
            super.emit("disconnect", reason);
        }
        /**
         * Called with socket packet.
         *
         * @param packet
         * @private
         */
        onpacket(packet) {
            const sameNamespace = packet.nsp === this.nsp;
            if (!sameNamespace)
                return;
            switch (packet.type) {
                case dist.PacketType.CONNECT:
                    if (packet.data && packet.data.sid) {
                        const id = packet.data.sid;
                        this.onconnect(id);
                    }
                    else {
                        super.emit("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
                    }
                    break;
                case dist.PacketType.EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.BINARY_EVENT:
                    this.onevent(packet);
                    break;
                case dist.PacketType.ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.BINARY_ACK:
                    this.onack(packet);
                    break;
                case dist.PacketType.DISCONNECT:
                    this.ondisconnect();
                    break;
                case dist.PacketType.CONNECT_ERROR:
                    const err = new Error(packet.data.message);
                    // @ts-ignore
                    err.data = packet.data.data;
                    super.emit("connect_error", err);
                    break;
            }
        }
        /**
         * Called upon a server event.
         *
         * @param packet
         * @private
         */
        onevent(packet) {
            const args = packet.data || [];
            debug("emitting event %j", args);
            if (null != packet.id) {
                debug("attaching ack callback to event");
                args.push(this.ack(packet.id));
            }
            if (this.connected) {
                this.emitEvent(args);
            }
            else {
                this.receiveBuffer.push(Object.freeze(args));
            }
        }
        emitEvent(args) {
            if (this._anyListeners && this._anyListeners.length) {
                const listeners = this._anyListeners.slice();
                for (const listener of listeners) {
                    listener.apply(this, args);
                }
            }
            super.emit.apply(this, args);
        }
        /**
         * Produces an ack callback to emit with an event.
         *
         * @private
         */
        ack(id) {
            const self = this;
            let sent = false;
            return function (...args) {
                // prevent double callbacks
                if (sent)
                    return;
                sent = true;
                debug("sending ack %j", args);
                self.packet({
                    type: dist.PacketType.ACK,
                    id: id,
                    data: args,
                });
            };
        }
        /**
         * Called upon a server acknowlegement.
         *
         * @param packet
         * @private
         */
        onack(packet) {
            const ack = this.acks[packet.id];
            if ("function" === typeof ack) {
                debug("calling ack %s with %j", packet.id, packet.data);
                ack.apply(this, packet.data);
                delete this.acks[packet.id];
            }
            else {
                debug("bad ack %s", packet.id);
            }
        }
        /**
         * Called upon server connect.
         *
         * @private
         */
        onconnect(id) {
            debug("socket connected with id %s", id);
            this.id = id;
            this.connected = true;
            this.disconnected = false;
            super.emit("connect");
            this.emitBuffered();
        }
        /**
         * Emit buffered events (received and emitted).
         *
         * @private
         */
        emitBuffered() {
            this.receiveBuffer.forEach((args) => this.emitEvent(args));
            this.receiveBuffer = [];
            this.sendBuffer.forEach((packet) => this.packet(packet));
            this.sendBuffer = [];
        }
        /**
         * Called upon server disconnect.
         *
         * @private
         */
        ondisconnect() {
            debug("server disconnect (%s)", this.nsp);
            this.destroy();
            this.onclose("io server disconnect");
        }
        /**
         * Called upon forced client/server side disconnections,
         * this method ensures the manager stops tracking us and
         * that reconnections don't get triggered for this.
         *
         * @private
         */
        destroy() {
            if (this.subs) {
                // clean subscriptions to avoid reconnections
                this.subs.forEach((subDestroy) => subDestroy());
                this.subs = undefined;
            }
            this.io["_destroy"](this);
        }
        /**
         * Disconnects the socket manually.
         *
         * @return self
         * @public
         */
        disconnect() {
            if (this.connected) {
                debug("performing disconnect (%s)", this.nsp);
                this.packet({ type: dist.PacketType.DISCONNECT });
            }
            // remove socket from pool
            this.destroy();
            if (this.connected) {
                // fire events
                this.onclose("io client disconnect");
            }
            return this;
        }
        /**
         * Alias for disconnect()
         *
         * @return self
         * @public
         */
        close() {
            return this.disconnect();
        }
        /**
         * Sets the compress flag.
         *
         * @param compress - if `true`, compresses the sending data
         * @return self
         * @public
         */
        compress(compress) {
            this.flags.compress = compress;
            return this;
        }
        /**
         * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
         * ready to send messages.
         *
         * @returns self
         * @public
         */
        get volatile() {
            this.flags.volatile = true;
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback.
         *
         * @param listener
         * @public
         */
        onAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.push(listener);
            return this;
        }
        /**
         * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
         * callback. The listener is added to the beginning of the listeners array.
         *
         * @param listener
         * @public
         */
        prependAny(listener) {
            this._anyListeners = this._anyListeners || [];
            this._anyListeners.unshift(listener);
            return this;
        }
        /**
         * Removes the listener that will be fired when any event is emitted.
         *
         * @param listener
         * @public
         */
        offAny(listener) {
            if (!this._anyListeners) {
                return this;
            }
            if (listener) {
                const listeners = this._anyListeners;
                for (let i = 0; i < listeners.length; i++) {
                    if (listener === listeners[i]) {
                        listeners.splice(i, 1);
                        return this;
                    }
                }
            }
            else {
                this._anyListeners = [];
            }
            return this;
        }
        /**
         * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
         * e.g. to remove listeners.
         *
         * @public
         */
        listenersAny() {
            return this._anyListeners || [];
        }
    }
    exports.Socket = Socket;
    });

    /**
     * Expose `Backoff`.
     */

    var backo2 = Backoff;

    /**
     * Initialize backoff timer with `opts`.
     *
     * - `min` initial timeout in milliseconds [100]
     * - `max` max timeout [10000]
     * - `jitter` [0]
     * - `factor` [2]
     *
     * @param {Object} opts
     * @api public
     */

    function Backoff(opts) {
      opts = opts || {};
      this.ms = opts.min || 100;
      this.max = opts.max || 10000;
      this.factor = opts.factor || 2;
      this.jitter = opts.jitter > 0 && opts.jitter <= 1 ? opts.jitter : 0;
      this.attempts = 0;
    }

    /**
     * Return the backoff duration.
     *
     * @return {Number}
     * @api public
     */

    Backoff.prototype.duration = function(){
      var ms = this.ms * Math.pow(this.factor, this.attempts++);
      if (this.jitter) {
        var rand =  Math.random();
        var deviation = Math.floor(rand * this.jitter * ms);
        ms = (Math.floor(rand * 10) & 1) == 0  ? ms - deviation : ms + deviation;
      }
      return Math.min(ms, this.max) | 0;
    };

    /**
     * Reset the number of attempts.
     *
     * @api public
     */

    Backoff.prototype.reset = function(){
      this.attempts = 0;
    };

    /**
     * Set the minimum duration
     *
     * @api public
     */

    Backoff.prototype.setMin = function(min){
      this.ms = min;
    };

    /**
     * Set the maximum duration
     *
     * @api public
     */

    Backoff.prototype.setMax = function(max){
      this.max = max;
    };

    /**
     * Set the jitter
     *
     * @api public
     */

    Backoff.prototype.setJitter = function(jitter){
      this.jitter = jitter;
    };

    var manager = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Manager = void 0;






    const debug = browser("socket.io-client:manager");
    class Manager extends componentEmitter {
        constructor(uri, opts) {
            super();
            this.nsps = {};
            this.subs = [];
            if (uri && "object" === typeof uri) {
                opts = uri;
                uri = undefined;
            }
            opts = opts || {};
            opts.path = opts.path || "/socket.io";
            this.opts = opts;
            this.reconnection(opts.reconnection !== false);
            this.reconnectionAttempts(opts.reconnectionAttempts || Infinity);
            this.reconnectionDelay(opts.reconnectionDelay || 1000);
            this.reconnectionDelayMax(opts.reconnectionDelayMax || 5000);
            this.randomizationFactor(opts.randomizationFactor || 0.5);
            this.backoff = new backo2({
                min: this.reconnectionDelay(),
                max: this.reconnectionDelayMax(),
                jitter: this.randomizationFactor(),
            });
            this.timeout(null == opts.timeout ? 20000 : opts.timeout);
            this._readyState = "closed";
            this.uri = uri;
            const _parser = opts.parser || dist;
            this.encoder = new _parser.Encoder();
            this.decoder = new _parser.Decoder();
            this._autoConnect = opts.autoConnect !== false;
            if (this._autoConnect)
                this.open();
        }
        reconnection(v) {
            if (!arguments.length)
                return this._reconnection;
            this._reconnection = !!v;
            return this;
        }
        reconnectionAttempts(v) {
            if (v === undefined)
                return this._reconnectionAttempts;
            this._reconnectionAttempts = v;
            return this;
        }
        reconnectionDelay(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelay;
            this._reconnectionDelay = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMin(v);
            return this;
        }
        randomizationFactor(v) {
            var _a;
            if (v === undefined)
                return this._randomizationFactor;
            this._randomizationFactor = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setJitter(v);
            return this;
        }
        reconnectionDelayMax(v) {
            var _a;
            if (v === undefined)
                return this._reconnectionDelayMax;
            this._reconnectionDelayMax = v;
            (_a = this.backoff) === null || _a === void 0 ? void 0 : _a.setMax(v);
            return this;
        }
        timeout(v) {
            if (!arguments.length)
                return this._timeout;
            this._timeout = v;
            return this;
        }
        /**
         * Starts trying to reconnect if reconnection is enabled and we have not
         * started reconnecting yet
         *
         * @private
         */
        maybeReconnectOnOpen() {
            // Only try to reconnect if it's the first time we're connecting
            if (!this._reconnecting &&
                this._reconnection &&
                this.backoff.attempts === 0) {
                // keeps reconnection from firing twice for the same reconnection loop
                this.reconnect();
            }
        }
        /**
         * Sets the current transport `socket`.
         *
         * @param {Function} fn - optional, callback
         * @return self
         * @public
         */
        open(fn) {
            debug("readyState %s", this._readyState);
            if (~this._readyState.indexOf("open"))
                return this;
            debug("opening %s", this.uri);
            this.engine = lib$1(this.uri, this.opts);
            const socket = this.engine;
            const self = this;
            this._readyState = "opening";
            this.skipReconnect = false;
            // emit `open`
            const openSubDestroy = on_1.on(socket, "open", function () {
                self.onopen();
                fn && fn();
            });
            // emit `error`
            const errorSub = on_1.on(socket, "error", (err) => {
                debug("error");
                self.cleanup();
                self._readyState = "closed";
                super.emit("error", err);
                if (fn) {
                    fn(err);
                }
                else {
                    // Only do this if there is no fn to handle the error
                    self.maybeReconnectOnOpen();
                }
            });
            if (false !== this._timeout) {
                const timeout = this._timeout;
                debug("connect attempt will timeout after %d", timeout);
                if (timeout === 0) {
                    openSubDestroy(); // prevents a race condition with the 'open' event
                }
                // set timer
                const timer = setTimeout(() => {
                    debug("connect attempt timed out after %d", timeout);
                    openSubDestroy();
                    socket.close();
                    socket.emit("error", new Error("timeout"));
                }, timeout);
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
            this.subs.push(openSubDestroy);
            this.subs.push(errorSub);
            return this;
        }
        /**
         * Alias for open()
         *
         * @return self
         * @public
         */
        connect(fn) {
            return this.open(fn);
        }
        /**
         * Called upon transport open.
         *
         * @private
         */
        onopen() {
            debug("open");
            // clear old subs
            this.cleanup();
            // mark as open
            this._readyState = "open";
            super.emit("open");
            // add new subs
            const socket = this.engine;
            this.subs.push(on_1.on(socket, "ping", this.onping.bind(this)), on_1.on(socket, "data", this.ondata.bind(this)), on_1.on(socket, "error", this.onerror.bind(this)), on_1.on(socket, "close", this.onclose.bind(this)), on_1.on(this.decoder, "decoded", this.ondecoded.bind(this)));
        }
        /**
         * Called upon a ping.
         *
         * @private
         */
        onping() {
            super.emit("ping");
        }
        /**
         * Called with data.
         *
         * @private
         */
        ondata(data) {
            this.decoder.add(data);
        }
        /**
         * Called when parser fully decodes a packet.
         *
         * @private
         */
        ondecoded(packet) {
            super.emit("packet", packet);
        }
        /**
         * Called upon socket error.
         *
         * @private
         */
        onerror(err) {
            debug("error", err);
            super.emit("error", err);
        }
        /**
         * Creates a new socket for the given `nsp`.
         *
         * @return {Socket}
         * @public
         */
        socket(nsp, opts) {
            let socket = this.nsps[nsp];
            if (!socket) {
                socket = new socket$1.Socket(this, nsp, opts);
                this.nsps[nsp] = socket;
            }
            return socket;
        }
        /**
         * Called upon a socket close.
         *
         * @param socket
         * @private
         */
        _destroy(socket) {
            const nsps = Object.keys(this.nsps);
            for (const nsp of nsps) {
                const socket = this.nsps[nsp];
                if (socket.active) {
                    debug("socket %s is still active, skipping close", nsp);
                    return;
                }
            }
            this._close();
        }
        /**
         * Writes a packet.
         *
         * @param packet
         * @private
         */
        _packet(packet) {
            debug("writing packet %j", packet);
            const encodedPackets = this.encoder.encode(packet);
            for (let i = 0; i < encodedPackets.length; i++) {
                this.engine.write(encodedPackets[i], packet.options);
            }
        }
        /**
         * Clean up transport subscriptions and packet buffer.
         *
         * @private
         */
        cleanup() {
            debug("cleanup");
            this.subs.forEach((subDestroy) => subDestroy());
            this.subs.length = 0;
            this.decoder.destroy();
        }
        /**
         * Close the current socket.
         *
         * @private
         */
        _close() {
            debug("disconnect");
            this.skipReconnect = true;
            this._reconnecting = false;
            if ("opening" === this._readyState) {
                // `onclose` will not fire because
                // an open event never happened
                this.cleanup();
            }
            this.backoff.reset();
            this._readyState = "closed";
            if (this.engine)
                this.engine.close();
        }
        /**
         * Alias for close()
         *
         * @private
         */
        disconnect() {
            return this._close();
        }
        /**
         * Called upon engine close.
         *
         * @private
         */
        onclose(reason) {
            debug("onclose");
            this.cleanup();
            this.backoff.reset();
            this._readyState = "closed";
            super.emit("close", reason);
            if (this._reconnection && !this.skipReconnect) {
                this.reconnect();
            }
        }
        /**
         * Attempt a reconnection.
         *
         * @private
         */
        reconnect() {
            if (this._reconnecting || this.skipReconnect)
                return this;
            const self = this;
            if (this.backoff.attempts >= this._reconnectionAttempts) {
                debug("reconnect failed");
                this.backoff.reset();
                super.emit("reconnect_failed");
                this._reconnecting = false;
            }
            else {
                const delay = this.backoff.duration();
                debug("will wait %dms before reconnect attempt", delay);
                this._reconnecting = true;
                const timer = setTimeout(() => {
                    if (self.skipReconnect)
                        return;
                    debug("attempting reconnect");
                    super.emit("reconnect_attempt", self.backoff.attempts);
                    // check again for the case socket closed in above events
                    if (self.skipReconnect)
                        return;
                    self.open((err) => {
                        if (err) {
                            debug("reconnect attempt error");
                            self._reconnecting = false;
                            self.reconnect();
                            super.emit("reconnect_error", err);
                        }
                        else {
                            debug("reconnect success");
                            self.onreconnect();
                        }
                    });
                }, delay);
                this.subs.push(function subDestroy() {
                    clearTimeout(timer);
                });
            }
        }
        /**
         * Called upon successful reconnect.
         *
         * @private
         */
        onreconnect() {
            const attempt = this.backoff.attempts;
            this._reconnecting = false;
            this.backoff.reset();
            super.emit("reconnect", attempt);
        }
    }
    exports.Manager = Manager;
    });

    var build = createCommonjsModule(function (module, exports) {
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Socket = exports.io = exports.Manager = exports.protocol = void 0;



    Object.defineProperty(exports, "Socket", { enumerable: true, get: function () { return socket$1.Socket; } });
    const debug = browser("socket.io-client");
    /**
     * Module exports.
     */
    module.exports = exports = lookup;
    /**
     * Managers cache.
     */
    const cache = (exports.managers = {});
    function lookup(uri, opts) {
        if (typeof uri === "object") {
            opts = uri;
            uri = undefined;
        }
        opts = opts || {};
        const parsed = url_1.url(uri, opts.path);
        const source = parsed.source;
        const id = parsed.id;
        const path = parsed.path;
        const sameNamespace = cache[id] && path in cache[id]["nsps"];
        const newConnection = opts.forceNew ||
            opts["force new connection"] ||
            false === opts.multiplex ||
            sameNamespace;
        let io;
        if (newConnection) {
            debug("ignoring socket cache for %s", source);
            io = new manager.Manager(source, opts);
        }
        else {
            if (!cache[id]) {
                debug("new io instance for %s", source);
                cache[id] = new manager.Manager(source, opts);
            }
            io = cache[id];
        }
        if (parsed.query && !opts.query) {
            opts.query = parsed.queryKey;
        }
        return io.socket(parsed.path, opts);
    }
    exports.io = lookup;
    /**
     * Protocol version.
     *
     * @public
     */

    Object.defineProperty(exports, "protocol", { enumerable: true, get: function () { return dist.protocol; } });
    /**
     * `connect`.
     *
     * @param {String} uri
     * @public
     */
    exports.connect = lookup;
    /**
     * Expose constructors for standalone build.
     *
     * @public
     */
    var manager_2 = manager;
    Object.defineProperty(exports, "Manager", { enumerable: true, get: function () { return manager_2.Manager; } });
    });

    var io = /*@__PURE__*/getDefaultExportFromCjs(build);

    io.Manager;

    /* src/Table.svelte generated by Svelte v3.32.3 */

    const { console: console_1$3 } = globals;
    const file$5 = "src/Table.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[27] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[24] = list[i];
    	return child_ctx;
    }

    // (90:14) {:else}
    function create_else_block$3(ctx) {
    	let input;
    	let input_value_value;
    	let mounted;
    	let dispose;

    	function keyup_handler() {
    		return /*keyup_handler*/ ctx[21](/*header*/ ctx[24], /*data*/ ctx[27]);
    	}

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "class", "apperance-none focus:outline-none w-11/12");
    			input.value = input_value_value = /*data*/ ctx[27][camelcase(/*header*/ ctx[24].name[0].toLowerCase() + /*header*/ ctx[24].name.substring(1))] || "";
    			add_location(input, file$5, 90, 16, 3054);
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

    			if (dirty[0] & /*displayedData, headers*/ 5 && input_value_value !== (input_value_value = /*data*/ ctx[27][camelcase(/*header*/ ctx[24].name[0].toLowerCase() + /*header*/ ctx[24].name.substring(1))] || "") && input.value !== input_value_value) {
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
    		source: "(90:14) {:else}",
    		ctx
    	});

    	return block;
    }

    // (88:14) {#if header.bcrypt}
    function create_if_block$4(ctx) {
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
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(88:14) {#if header.bcrypt}",
    		ctx
    	});

    	return block;
    }

    // (85:8) {#each headers as header}
    function create_each_block_2(ctx) {
    	let td;
    	let span;

    	function select_block_type(ctx, dirty) {
    		if (/*header*/ ctx[24].bcrypt) return create_if_block$4;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			if_block.c();
    			attr_dev(span, "class", "text-center ml-2 text-base");
    			add_location(span, file$5, 86, 12, 2911);
    			attr_dev(td, "class", "border border-gray-300 text-left");
    			add_location(td, file$5, 85, 10, 2853);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, span);
    			if_block.m(span, null);
    		},
    		p: function update(ctx, dirty) {
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
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(85:8) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    // (71:4) {#each displayedData as data}
    function create_each_block_1$1(ctx) {
    	let tr;
    	let td0;
    	let span0;
    	let svg;
    	let path;
    	let t0;
    	let td1;
    	let span1;
    	let t1_value = /*data*/ ctx[27]._id + "";
    	let t1;
    	let t2;
    	let t3;
    	let td2;
    	let span2;
    	let td2_class_value;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[20](/*data*/ ctx[27]);
    	}

    	let each_value_2 = /*headers*/ ctx[0];
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
    			add_location(path, file$5, 75, 14, 2386);
    			attr_dev(svg, "class", "h-4 w-4 text-gray-700 hover:text-gray-900 cursor-pointer");
    			attr_dev(svg, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg, "fill", "none");
    			attr_dev(svg, "viewBox", "0 0 24 24");
    			attr_dev(svg, "stroke", "currentColor");
    			add_location(svg, file$5, 74, 12, 2212);
    			attr_dev(span0, "class", "flex items-center justify-center");
    			add_location(span0, file$5, 73, 10, 2112);
    			attr_dev(td0, "class", "bg-white border border-gray-300 text-left");
    			add_location(td0, file$5, 72, 8, 2047);
    			attr_dev(span1, "class", "text-center ml-2 text-base");
    			add_location(span1, file$5, 80, 10, 2712);
    			attr_dev(td1, "class", "bg-white border border-gray-300 text-left");
    			add_location(td1, file$5, 79, 8, 2647);
    			attr_dev(span2, "class", "text-center ml-2 text-base");
    			add_location(span2, file$5, 96, 10, 3424);
    			attr_dev(td2, "class", td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[8] ? "" : "hidden"}`);
    			add_location(td2, file$5, 95, 8, 3333);
    			attr_dev(tr, "class", "bg-white");
    			add_location(tr, file$5, 71, 6, 2017);
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
    			if (dirty[0] & /*displayedData*/ 4 && t1_value !== (t1_value = /*data*/ ctx[27]._id + "")) set_data_dev(t1, t1_value);

    			if (dirty[0] & /*headers, displayedData, updateField*/ 517) {
    				each_value_2 = /*headers*/ ctx[0];
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

    			if (dirty[0] & /*hoverNewField*/ 256 && td2_class_value !== (td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[8] ? "" : "hidden"}`)) {
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
    		source: "(71:4) {#each displayedData as data}",
    		ctx
    	});

    	return block;
    }

    // (108:6) {#each headers as header}
    function create_each_block$3(ctx) {
    	let td;
    	let span;

    	const block = {
    		c: function create() {
    			td = element("td");
    			span = element("span");
    			attr_dev(span, "class", "text-center ml-2 text-base");
    			add_location(span, file$5, 109, 10, 3840);
    			attr_dev(td, "class", "border border-gray-300 text-left");
    			add_location(td, file$5, 108, 8, 3784);
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
    		source: "(108:6) {#each headers as header}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let table;
    	let tableheader;
    	let updating_fieldEdit;
    	let updating_settingDefault;
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

    	function tableheader_fieldEdit_binding(value) {
    		/*tableheader_fieldEdit_binding*/ ctx[13](value);
    	}

    	function tableheader_settingDefault_binding(value) {
    		/*tableheader_settingDefault_binding*/ ctx[14](value);
    	}

    	function tableheader_hoverNewField_binding(value) {
    		/*tableheader_hoverNewField_binding*/ ctx[15](value);
    	}

    	function tableheader_headers_binding(value) {
    		/*tableheader_headers_binding*/ ctx[16](value);
    	}

    	function tableheader_activeTable_binding(value) {
    		/*tableheader_activeTable_binding*/ ctx[17](value);
    	}

    	function tableheader_dataTables_binding(value) {
    		/*tableheader_dataTables_binding*/ ctx[18](value);
    	}

    	function tableheader_displayedData_binding(value) {
    		/*tableheader_displayedData_binding*/ ctx[19](value);
    	}

    	let tableheader_props = {
    		token: /*token*/ ctx[6],
    		currentUser: /*currentUser*/ ctx[7]
    	};

    	if (/*fieldEdit*/ ctx[5] !== void 0) {
    		tableheader_props.fieldEdit = /*fieldEdit*/ ctx[5];
    	}

    	if (/*settingDefault*/ ctx[4] !== void 0) {
    		tableheader_props.settingDefault = /*settingDefault*/ ctx[4];
    	}

    	if (/*hoverNewField*/ ctx[8] !== void 0) {
    		tableheader_props.hoverNewField = /*hoverNewField*/ ctx[8];
    	}

    	if (/*headers*/ ctx[0] !== void 0) {
    		tableheader_props.headers = /*headers*/ ctx[0];
    	}

    	if (/*activeTable*/ ctx[1] !== void 0) {
    		tableheader_props.activeTable = /*activeTable*/ ctx[1];
    	}

    	if (/*dataTables*/ ctx[3] !== void 0) {
    		tableheader_props.dataTables = /*dataTables*/ ctx[3];
    	}

    	if (/*displayedData*/ ctx[2] !== void 0) {
    		tableheader_props.displayedData = /*displayedData*/ ctx[2];
    	}

    	tableheader = new TableHeader({ props: tableheader_props, $$inline: true });
    	binding_callbacks.push(() => bind(tableheader, "fieldEdit", tableheader_fieldEdit_binding));
    	binding_callbacks.push(() => bind(tableheader, "settingDefault", tableheader_settingDefault_binding));
    	binding_callbacks.push(() => bind(tableheader, "hoverNewField", tableheader_hoverNewField_binding));
    	binding_callbacks.push(() => bind(tableheader, "headers", tableheader_headers_binding));
    	binding_callbacks.push(() => bind(tableheader, "activeTable", tableheader_activeTable_binding));
    	binding_callbacks.push(() => bind(tableheader, "dataTables", tableheader_dataTables_binding));
    	binding_callbacks.push(() => bind(tableheader, "displayedData", tableheader_displayedData_binding));
    	let each_value_1 = /*displayedData*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*headers*/ ctx[0];
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
    			add_location(span0, file$5, 103, 8, 3662);
    			attr_dev(td0, "class", "border border-gray-300 text-left");
    			add_location(td0, file$5, 102, 6, 3608);
    			attr_dev(span1, "class", "text-center ml-2 text-base");
    			add_location(span1, file$5, 115, 8, 3989);
    			attr_dev(td1, "class", "border border-gray-300 text-left");
    			add_location(td1, file$5, 114, 6, 3935);
    			attr_dev(span2, "class", "text-center ml-2 text-base");
    			add_location(span2, file$5, 120, 8, 4155);
    			attr_dev(td2, "class", td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[8] ? "" : "hidden"}`);
    			add_location(td2, file$5, 119, 6, 4066);
    			attr_dev(tr, "class", "bg-white hover:bg-gray-100 cursor-pointer");
    			add_location(tr, file$5, 101, 4, 3526);
    			attr_dev(tbody, "class", "bg-gray-200");
    			add_location(tbody, file$5, 69, 2, 1949);
    			attr_dev(table, "class", "min-w-full");
    			add_location(table, file$5, 67, 0, 1646);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    				dispose = listen_dev(tr, "click", /*newRecord*/ ctx[11], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			const tableheader_changes = {};
    			if (dirty[0] & /*token*/ 64) tableheader_changes.token = /*token*/ ctx[6];
    			if (dirty[0] & /*currentUser*/ 128) tableheader_changes.currentUser = /*currentUser*/ ctx[7];

    			if (!updating_fieldEdit && dirty[0] & /*fieldEdit*/ 32) {
    				updating_fieldEdit = true;
    				tableheader_changes.fieldEdit = /*fieldEdit*/ ctx[5];
    				add_flush_callback(() => updating_fieldEdit = false);
    			}

    			if (!updating_settingDefault && dirty[0] & /*settingDefault*/ 16) {
    				updating_settingDefault = true;
    				tableheader_changes.settingDefault = /*settingDefault*/ ctx[4];
    				add_flush_callback(() => updating_settingDefault = false);
    			}

    			if (!updating_hoverNewField && dirty[0] & /*hoverNewField*/ 256) {
    				updating_hoverNewField = true;
    				tableheader_changes.hoverNewField = /*hoverNewField*/ ctx[8];
    				add_flush_callback(() => updating_hoverNewField = false);
    			}

    			if (!updating_headers && dirty[0] & /*headers*/ 1) {
    				updating_headers = true;
    				tableheader_changes.headers = /*headers*/ ctx[0];
    				add_flush_callback(() => updating_headers = false);
    			}

    			if (!updating_activeTable && dirty[0] & /*activeTable*/ 2) {
    				updating_activeTable = true;
    				tableheader_changes.activeTable = /*activeTable*/ ctx[1];
    				add_flush_callback(() => updating_activeTable = false);
    			}

    			if (!updating_dataTables && dirty[0] & /*dataTables*/ 8) {
    				updating_dataTables = true;
    				tableheader_changes.dataTables = /*dataTables*/ ctx[3];
    				add_flush_callback(() => updating_dataTables = false);
    			}

    			if (!updating_displayedData && dirty[0] & /*displayedData*/ 4) {
    				updating_displayedData = true;
    				tableheader_changes.displayedData = /*displayedData*/ ctx[2];
    				add_flush_callback(() => updating_displayedData = false);
    			}

    			tableheader.$set(tableheader_changes);

    			if (dirty[0] & /*hoverNewField, headers, displayedData, updateField, deleteRecord*/ 1797) {
    				each_value_1 = /*displayedData*/ ctx[2];
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

    			if (dirty[0] & /*headers*/ 1) {
    				const old_length = each_value.length;
    				each_value = /*headers*/ ctx[0];
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

    			if (!current || dirty[0] & /*hoverNewField*/ 256 && td2_class_value !== (td2_class_value = `border border-gray-300 text-left ${/*hoverNewField*/ ctx[8] ? "" : "hidden"}`)) {
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
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Table", slots, []);
    	let { token } = $$props;
    	let { currentUser } = $$props;
    	let { headers } = $$props;
    	let { activeTable } = $$props;
    	let { displayedData } = $$props;
    	let { newColHeader } = $$props;
    	let { dataTables } = $$props;
    	let { settingDefault } = $$props;
    	let { fieldEdit } = $$props;

    	const reload = async () => {
    		try {
    			$$invalidate(2, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(0, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const socket = io();
    	socket.io.connect(window.location.hostname);
    	socket.on("breadUpdate", reload);
    	let hoverNewField = false;

    	const updateField = async (field, id) => {
    		try {
    			let update = await api.put(`${activeTable.replace(/ /g, "-")}`, token, {
    				updates: { [camelcase(field)]: event.target.value },
    				filters: { _id: id }
    			});
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const deleteRecord = async id => {
    		try {
    			let record = await api.destroy(`${activeTable.replace(/ /g, "-")}/${id}`, token);
    			$$invalidate(2, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(0, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const newRecord = async () => {
    		try {
    			let record = await api.post(`${activeTable.replace(/ /g, "-")}`, token, {});
    			$$invalidate(2, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(0, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const writable_props = [
    		"token",
    		"currentUser",
    		"headers",
    		"activeTable",
    		"displayedData",
    		"newColHeader",
    		"dataTables",
    		"settingDefault",
    		"fieldEdit"
    	];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$3.warn(`<Table> was created with unknown prop '${key}'`);
    	});

    	function tableheader_fieldEdit_binding(value) {
    		fieldEdit = value;
    		$$invalidate(5, fieldEdit);
    	}

    	function tableheader_settingDefault_binding(value) {
    		settingDefault = value;
    		$$invalidate(4, settingDefault);
    	}

    	function tableheader_hoverNewField_binding(value) {
    		hoverNewField = value;
    		$$invalidate(8, hoverNewField);
    	}

    	function tableheader_headers_binding(value) {
    		headers = value;
    		$$invalidate(0, headers);
    	}

    	function tableheader_activeTable_binding(value) {
    		activeTable = value;
    		$$invalidate(1, activeTable);
    	}

    	function tableheader_dataTables_binding(value) {
    		dataTables = value;
    		$$invalidate(3, dataTables);
    	}

    	function tableheader_displayedData_binding(value) {
    		displayedData = value;
    		$$invalidate(2, displayedData);
    	}

    	const click_handler = data => deleteRecord(data._id);
    	const keyup_handler = (header, data) => updateField(header.name, data._id);

    	$$self.$$set = $$props => {
    		if ("token" in $$props) $$invalidate(6, token = $$props.token);
    		if ("currentUser" in $$props) $$invalidate(7, currentUser = $$props.currentUser);
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("displayedData" in $$props) $$invalidate(2, displayedData = $$props.displayedData);
    		if ("newColHeader" in $$props) $$invalidate(12, newColHeader = $$props.newColHeader);
    		if ("dataTables" in $$props) $$invalidate(3, dataTables = $$props.dataTables);
    		if ("settingDefault" in $$props) $$invalidate(4, settingDefault = $$props.settingDefault);
    		if ("fieldEdit" in $$props) $$invalidate(5, fieldEdit = $$props.fieldEdit);
    	};

    	$$self.$capture_state = () => ({
    		TableHeader,
    		api,
    		getHeaders,
    		camelcase,
    		token,
    		currentUser,
    		headers,
    		activeTable,
    		displayedData,
    		newColHeader,
    		dataTables,
    		settingDefault,
    		fieldEdit,
    		io,
    		reload,
    		socket,
    		hoverNewField,
    		updateField,
    		deleteRecord,
    		newRecord
    	});

    	$$self.$inject_state = $$props => {
    		if ("token" in $$props) $$invalidate(6, token = $$props.token);
    		if ("currentUser" in $$props) $$invalidate(7, currentUser = $$props.currentUser);
    		if ("headers" in $$props) $$invalidate(0, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(1, activeTable = $$props.activeTable);
    		if ("displayedData" in $$props) $$invalidate(2, displayedData = $$props.displayedData);
    		if ("newColHeader" in $$props) $$invalidate(12, newColHeader = $$props.newColHeader);
    		if ("dataTables" in $$props) $$invalidate(3, dataTables = $$props.dataTables);
    		if ("settingDefault" in $$props) $$invalidate(4, settingDefault = $$props.settingDefault);
    		if ("fieldEdit" in $$props) $$invalidate(5, fieldEdit = $$props.fieldEdit);
    		if ("hoverNewField" in $$props) $$invalidate(8, hoverNewField = $$props.hoverNewField);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		headers,
    		activeTable,
    		displayedData,
    		dataTables,
    		settingDefault,
    		fieldEdit,
    		token,
    		currentUser,
    		hoverNewField,
    		updateField,
    		deleteRecord,
    		newRecord,
    		newColHeader,
    		tableheader_fieldEdit_binding,
    		tableheader_settingDefault_binding,
    		tableheader_hoverNewField_binding,
    		tableheader_headers_binding,
    		tableheader_activeTable_binding,
    		tableheader_dataTables_binding,
    		tableheader_displayedData_binding,
    		click_handler,
    		keyup_handler
    	];
    }

    class Table extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(
    			this,
    			options,
    			instance$5,
    			create_fragment$5,
    			safe_not_equal,
    			{
    				token: 6,
    				currentUser: 7,
    				headers: 0,
    				activeTable: 1,
    				displayedData: 2,
    				newColHeader: 12,
    				dataTables: 3,
    				settingDefault: 4,
    				fieldEdit: 5
    			},
    			[-1, -1]
    		);

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Table",
    			options,
    			id: create_fragment$5.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*token*/ ctx[6] === undefined && !("token" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'token'");
    		}

    		if (/*currentUser*/ ctx[7] === undefined && !("currentUser" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'currentUser'");
    		}

    		if (/*headers*/ ctx[0] === undefined && !("headers" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'headers'");
    		}

    		if (/*activeTable*/ ctx[1] === undefined && !("activeTable" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'activeTable'");
    		}

    		if (/*displayedData*/ ctx[2] === undefined && !("displayedData" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'displayedData'");
    		}

    		if (/*newColHeader*/ ctx[12] === undefined && !("newColHeader" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'newColHeader'");
    		}

    		if (/*dataTables*/ ctx[3] === undefined && !("dataTables" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'dataTables'");
    		}

    		if (/*settingDefault*/ ctx[4] === undefined && !("settingDefault" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'settingDefault'");
    		}

    		if (/*fieldEdit*/ ctx[5] === undefined && !("fieldEdit" in props)) {
    			console_1$3.warn("<Table> was created without expected prop 'fieldEdit'");
    		}
    	}

    	get token() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set token(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get currentUser() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set currentUser(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get headers() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set headers(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeTable() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeTable(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get displayedData() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set displayedData(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get newColHeader() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set newColHeader(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get dataTables() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set dataTables(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get settingDefault() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set settingDefault(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get fieldEdit() {
    		throw new Error("<Table>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set fieldEdit(value) {
    		throw new Error("<Table>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.32.3 */

    const { console: console_1$4 } = globals;
    const file$6 = "src/App.svelte";

    // (100:2) {#if settingDefault}
    function create_if_block_2$1(ctx) {
    	let div4;
    	let div3;
    	let p;
    	let t1;
    	let textarea;
    	let textarea_id_value;
    	let textarea_value_value;
    	let t2;
    	let div2;
    	let div0;
    	let t4;
    	let div1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div4 = element("div");
    			div3 = element("div");
    			p = element("p");
    			p.textContent = "Set default value. Use \"()\" notation for functions.";
    			t1 = space();
    			textarea = element("textarea");
    			t2 = space();
    			div2 = element("div");
    			div0 = element("div");
    			div0.textContent = "Cancel";
    			t4 = space();
    			div1 = element("div");
    			div1.textContent = "Save";
    			attr_dev(p, "class", "text-md font-semibold text-gray-900");
    			add_location(p, file$6, 102, 4, 2804);
    			attr_dev(textarea, "id", textarea_id_value = `default-${/*settingDefault*/ ctx[8].name}`);
    			attr_dev(textarea, "class", "focus:outline-none border-2 border-green-200 text-gray-900 apperance-none bg-white rounded-lg w-full p-2");
    			textarea.value = textarea_value_value = /*settingDefault*/ ctx[8].def;
    			add_location(textarea, file$6, 103, 5, 2912);
    			attr_dev(div0, "class", "bg-red-600 text-white cursor-pointer p-2 rounded-lg flex items-center justify-center mr-6");
    			add_location(div0, file$6, 105, 5, 3153);
    			attr_dev(div1, "class", "bg-green-600 text-white cursor-pointer p-2 rounded-lg flex items-center justify-center");
    			add_location(div1, file$6, 106, 6, 3312);
    			attr_dev(div2, "class", "w-full flex justify-end");
    			add_location(div2, file$6, 104, 5, 3110);
    			attr_dev(div3, "class", "rounded-lg bg-white p-12 flex flex-col items-center justify-center space-y-4");
    			add_location(div3, file$6, 101, 4, 2709);
    			attr_dev(div4, "class", "bg-transparent h-screen w-screen z-50 fixed flex items-center justify-center");
    			add_location(div4, file$6, 100, 3, 2614);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, p);
    			append_dev(div3, t1);
    			append_dev(div3, textarea);
    			append_dev(div3, t2);
    			append_dev(div3, div2);
    			append_dev(div2, div0);
    			append_dev(div2, t4);
    			append_dev(div2, div1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(div0, "click", /*click_handler*/ ctx[14], false, false, false),
    					listen_dev(div1, "click", /*click_handler_1*/ ctx[15], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*settingDefault*/ 256 && textarea_id_value !== (textarea_id_value = `default-${/*settingDefault*/ ctx[8].name}`)) {
    				attr_dev(textarea, "id", textarea_id_value);
    			}

    			if (dirty & /*settingDefault*/ 256 && textarea_value_value !== (textarea_value_value = /*settingDefault*/ ctx[8].def)) {
    				prop_dev(textarea, "value", textarea_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div4);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2$1.name,
    		type: "if",
    		source: "(100:2) {#if settingDefault}",
    		ctx
    	});

    	return block;
    }

    // (117:2) {#if !loggedin}
    function create_if_block_1$4(ctx) {
    	let loggedin_1;
    	let updating_currentUser;
    	let updating_loggedin;
    	let current;

    	function loggedin_1_currentUser_binding(value) {
    		/*loggedin_1_currentUser_binding*/ ctx[16](value);
    	}

    	function loggedin_1_loggedin_binding(value) {
    		/*loggedin_1_loggedin_binding*/ ctx[17](value);
    	}

    	let loggedin_1_props = {
    		loadData: /*loadData*/ ctx[11],
    		checkUser: /*checkUser*/ ctx[10]
    	};

    	if (/*currentUser*/ ctx[5] !== void 0) {
    		loggedin_1_props.currentUser = /*currentUser*/ ctx[5];
    	}

    	if (/*loggedin*/ ctx[4] !== void 0) {
    		loggedin_1_props.loggedin = /*loggedin*/ ctx[4];
    	}

    	loggedin_1 = new LoggedIn({ props: loggedin_1_props, $$inline: true });
    	binding_callbacks.push(() => bind(loggedin_1, "currentUser", loggedin_1_currentUser_binding));
    	binding_callbacks.push(() => bind(loggedin_1, "loggedin", loggedin_1_loggedin_binding));

    	const block = {
    		c: function create() {
    			create_component(loggedin_1.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(loggedin_1, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const loggedin_1_changes = {};

    			if (!updating_currentUser && dirty & /*currentUser*/ 32) {
    				updating_currentUser = true;
    				loggedin_1_changes.currentUser = /*currentUser*/ ctx[5];
    				add_flush_callback(() => updating_currentUser = false);
    			}

    			if (!updating_loggedin && dirty & /*loggedin*/ 16) {
    				updating_loggedin = true;
    				loggedin_1_changes.loggedin = /*loggedin*/ ctx[4];
    				add_flush_callback(() => updating_loggedin = false);
    			}

    			loggedin_1.$set(loggedin_1_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(loggedin_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(loggedin_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(loggedin_1, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(117:2) {#if !loggedin}",
    		ctx
    	});

    	return block;
    }

    // (124:2) {:else}
    function create_else_block$4(ctx) {
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
    			add_location(p, file$6, 126, 5, 4922);
    			attr_dev(div0, "class", "bg-green-200 text-gray-900 font-semibold text-lg p-2 flex items-center justify-center rounded-lg cursor-pointer transform duration-150 shadow-md hover:-translate-y-1 hover:shadow-lg");
    			add_location(div0, file$6, 127, 5, 5033);
    			attr_dev(div1, "class", "flex flex-col absolute -ml-48");
    			add_location(div1, file$6, 125, 4, 4873);
    			attr_dev(img, "class", "h-3/4 object-scale");
    			if (img.src !== (img_src_value = "./empty.png")) attr_dev(img, "src", img_src_value);
    			add_location(img, file$6, 129, 4, 5292);
    			attr_dev(div2, "class", "w-3/4 h-full flex items-center -mt-24 justify-center");
    			add_location(div2, file$6, 124, 3, 4802);
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
    				dispose = listen_dev(div0, "click", /*newColHeader*/ ctx[12], false, false, false);
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
    		id: create_else_block$4.name,
    		type: "else",
    		source: "(124:2) {:else}",
    		ctx
    	});

    	return block;
    }

    // (122:2) {#if headers.length > 0}
    function create_if_block$5(ctx) {
    	let table;
    	let updating_fieldEdit;
    	let updating_settingDefault;
    	let updating_dataTables;
    	let updating_displayedData;
    	let updating_headers;
    	let current;

    	function table_fieldEdit_binding(value) {
    		/*table_fieldEdit_binding*/ ctx[22](value);
    	}

    	function table_settingDefault_binding(value) {
    		/*table_settingDefault_binding*/ ctx[23](value);
    	}

    	function table_dataTables_binding(value) {
    		/*table_dataTables_binding*/ ctx[24](value);
    	}

    	function table_displayedData_binding(value) {
    		/*table_displayedData_binding*/ ctx[25](value);
    	}

    	function table_headers_binding(value) {
    		/*table_headers_binding*/ ctx[26](value);
    	}

    	let table_props = {
    		newColHeader: /*newColHeader*/ ctx[12],
    		token: /*token*/ ctx[7],
    		activeTable: /*activeTable*/ ctx[3],
    		currentUser: /*currentUser*/ ctx[5]
    	};

    	if (/*fieldEdit*/ ctx[9] !== void 0) {
    		table_props.fieldEdit = /*fieldEdit*/ ctx[9];
    	}

    	if (/*settingDefault*/ ctx[8] !== void 0) {
    		table_props.settingDefault = /*settingDefault*/ ctx[8];
    	}

    	if (/*dataTables*/ ctx[0] !== void 0) {
    		table_props.dataTables = /*dataTables*/ ctx[0];
    	}

    	if (/*displayedData*/ ctx[1] !== void 0) {
    		table_props.displayedData = /*displayedData*/ ctx[1];
    	}

    	if (/*headers*/ ctx[2] !== void 0) {
    		table_props.headers = /*headers*/ ctx[2];
    	}

    	table = new Table({ props: table_props, $$inline: true });
    	binding_callbacks.push(() => bind(table, "fieldEdit", table_fieldEdit_binding));
    	binding_callbacks.push(() => bind(table, "settingDefault", table_settingDefault_binding));
    	binding_callbacks.push(() => bind(table, "dataTables", table_dataTables_binding));
    	binding_callbacks.push(() => bind(table, "displayedData", table_displayedData_binding));
    	binding_callbacks.push(() => bind(table, "headers", table_headers_binding));

    	const block = {
    		c: function create() {
    			create_component(table.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(table, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const table_changes = {};
    			if (dirty & /*token*/ 128) table_changes.token = /*token*/ ctx[7];
    			if (dirty & /*activeTable*/ 8) table_changes.activeTable = /*activeTable*/ ctx[3];
    			if (dirty & /*currentUser*/ 32) table_changes.currentUser = /*currentUser*/ ctx[5];

    			if (!updating_fieldEdit && dirty & /*fieldEdit*/ 512) {
    				updating_fieldEdit = true;
    				table_changes.fieldEdit = /*fieldEdit*/ ctx[9];
    				add_flush_callback(() => updating_fieldEdit = false);
    			}

    			if (!updating_settingDefault && dirty & /*settingDefault*/ 256) {
    				updating_settingDefault = true;
    				table_changes.settingDefault = /*settingDefault*/ ctx[8];
    				add_flush_callback(() => updating_settingDefault = false);
    			}

    			if (!updating_dataTables && dirty & /*dataTables*/ 1) {
    				updating_dataTables = true;
    				table_changes.dataTables = /*dataTables*/ ctx[0];
    				add_flush_callback(() => updating_dataTables = false);
    			}

    			if (!updating_displayedData && dirty & /*displayedData*/ 2) {
    				updating_displayedData = true;
    				table_changes.displayedData = /*displayedData*/ ctx[1];
    				add_flush_callback(() => updating_displayedData = false);
    			}

    			if (!updating_headers && dirty & /*headers*/ 4) {
    				updating_headers = true;
    				table_changes.headers = /*headers*/ ctx[2];
    				add_flush_callback(() => updating_headers = false);
    			}

    			table.$set(table_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(table.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(table.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(table, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(122:2) {#if headers.length > 0}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let body;
    	let t0;
    	let apidocs;
    	let t1;
    	let t2;
    	let header;
    	let updating_showAPIDocs;
    	let updating_activeTable;
    	let updating_headers;
    	let updating_displayedData;
    	let t3;
    	let div;
    	let current_block_type_index;
    	let if_block2;
    	let current;
    	let if_block0 = /*settingDefault*/ ctx[8] && create_if_block_2$1(ctx);

    	apidocs = new ApiDocs({
    			props: {
    				headers: /*headers*/ ctx[2],
    				activeTable: /*activeTable*/ ctx[3],
    				showAPIDocs: /*showAPIDocs*/ ctx[6]
    			},
    			$$inline: true
    		});

    	let if_block1 = !/*loggedin*/ ctx[4] && create_if_block_1$4(ctx);

    	function header_showAPIDocs_binding(value) {
    		/*header_showAPIDocs_binding*/ ctx[18](value);
    	}

    	function header_activeTable_binding(value) {
    		/*header_activeTable_binding*/ ctx[19](value);
    	}

    	function header_headers_binding(value) {
    		/*header_headers_binding*/ ctx[20](value);
    	}

    	function header_displayedData_binding(value) {
    		/*header_displayedData_binding*/ ctx[21](value);
    	}

    	let header_props = {
    		token: /*token*/ ctx[7],
    		currentUser: /*currentUser*/ ctx[5],
    		dataTables: /*dataTables*/ ctx[0]
    	};

    	if (/*showAPIDocs*/ ctx[6] !== void 0) {
    		header_props.showAPIDocs = /*showAPIDocs*/ ctx[6];
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
    	const if_block_creators = [create_if_block$5, create_else_block$4];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*headers*/ ctx[2].length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			body = element("body");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			create_component(apidocs.$$.fragment);
    			t1 = space();
    			if (if_block1) if_block1.c();
    			t2 = space();
    			create_component(header.$$.fragment);
    			t3 = space();
    			div = element("div");
    			if_block2.c();
    			attr_dev(div, "class", "pb-6 w-screen h-full flex justify-center overflow-x-scroll");
    			add_location(div, file$6, 120, 2, 4432);
    			attr_dev(body, "class", "h-screen");
    			add_location(body, file$6, 98, 0, 2564);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, body, anchor);
    			if (if_block0) if_block0.m(body, null);
    			append_dev(body, t0);
    			mount_component(apidocs, body, null);
    			append_dev(body, t1);
    			if (if_block1) if_block1.m(body, null);
    			append_dev(body, t2);
    			mount_component(header, body, null);
    			append_dev(body, t3);
    			append_dev(body, div);
    			if_blocks[current_block_type_index].m(div, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*settingDefault*/ ctx[8]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2$1(ctx);
    					if_block0.c();
    					if_block0.m(body, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			const apidocs_changes = {};
    			if (dirty & /*headers*/ 4) apidocs_changes.headers = /*headers*/ ctx[2];
    			if (dirty & /*activeTable*/ 8) apidocs_changes.activeTable = /*activeTable*/ ctx[3];
    			if (dirty & /*showAPIDocs*/ 64) apidocs_changes.showAPIDocs = /*showAPIDocs*/ ctx[6];
    			apidocs.$set(apidocs_changes);

    			if (!/*loggedin*/ ctx[4]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);

    					if (dirty & /*loggedin*/ 16) {
    						transition_in(if_block1, 1);
    					}
    				} else {
    					if_block1 = create_if_block_1$4(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(body, t2);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}

    			const header_changes = {};
    			if (dirty & /*token*/ 128) header_changes.token = /*token*/ ctx[7];
    			if (dirty & /*currentUser*/ 32) header_changes.currentUser = /*currentUser*/ ctx[5];
    			if (dirty & /*dataTables*/ 1) header_changes.dataTables = /*dataTables*/ ctx[0];

    			if (!updating_showAPIDocs && dirty & /*showAPIDocs*/ 64) {
    				updating_showAPIDocs = true;
    				header_changes.showAPIDocs = /*showAPIDocs*/ ctx[6];
    				add_flush_callback(() => updating_showAPIDocs = false);
    			}

    			if (!updating_activeTable && dirty & /*activeTable*/ 8) {
    				updating_activeTable = true;
    				header_changes.activeTable = /*activeTable*/ ctx[3];
    				add_flush_callback(() => updating_activeTable = false);
    			}

    			if (!updating_headers && dirty & /*headers*/ 4) {
    				updating_headers = true;
    				header_changes.headers = /*headers*/ ctx[2];
    				add_flush_callback(() => updating_headers = false);
    			}

    			if (!updating_displayedData && dirty & /*displayedData*/ 2) {
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
    				if_block2 = if_blocks[current_block_type_index];

    				if (!if_block2) {
    					if_block2 = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block2.c();
    				} else {
    					if_block2.p(ctx, dirty);
    				}

    				transition_in(if_block2, 1);
    				if_block2.m(div, null);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(apidocs.$$.fragment, local);
    			transition_in(if_block1);
    			transition_in(header.$$.fragment, local);
    			transition_in(if_block2);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(apidocs.$$.fragment, local);
    			transition_out(if_block1);
    			transition_out(header.$$.fragment, local);
    			transition_out(if_block2);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(body);
    			if (if_block0) if_block0.d();
    			destroy_component(apidocs);
    			if (if_block1) if_block1.d();
    			destroy_component(header);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	let dataTables = [];
    	let displayedData = [];
    	let headers = [];
    	let activeTable;
    	let loggedin = false;
    	let currentUser;
    	let showAPIDocs = false;
    	let token;
    	let settingDefault = "";
    	let fieldEdit;

    	const checkUser = async () => {
    		$$invalidate(7, token = window.sessionStorage.getItem("api_key"));
    		return api.get("/r/admins", token);
    	};

    	const loadData = async () => {
    		try {
    			$$invalidate(0, dataTables = await api.get("database", token));
    			$$invalidate(3, activeTable = dataTables[1].name);
    			$$invalidate(2, headers = getHeaders(dataTables, dataTables[1].name));
    			$$invalidate(1, displayedData = await api.get(dataTables[1].name.replace(/ /g, "-"), token));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	onMount(async () => {
    		if (!window.sessionStorage.getItem("api_key")) {
    			let findToken = await api.findToken();
    			findToken = await findToken.json();
    			console.log(findToken);
    			if (findToken.message) return false;
    			window.sessionStorage.setItem("api_key", findToken.token);
    		}

    		try {
    			let user = await checkUser();

    			if (user && user.username) {
    				$$invalidate(5, currentUser = user);
    				$$invalidate(4, loggedin = true);
    				loadData();
    			}
    		} catch(err) {
    			console.log(err);
    		}
    	});

    	const newColHeader = async () => {
    		try {
    			const id = "column" + Math.floor(Math.random() * Math.floor(100));
    			let col = await api.put(`database/${activeTable.replace(/ /g, "-")}`, token, { props: { name: id, type: "String" } });
    			$$invalidate(1, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(2, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const changeDefault = async (field, id) => {
    		try {
    			let domId = field.replace(/ /g, "-");
    			let defaultValue = document.querySelector(`#default-${domId}`).value;
    			console.log(defaultValue);
    			let update = await api.put(`database/${activeTable.replace(/ /g, "-")}/${id}`, token, { default: defaultValue });
    			$$invalidate(8, settingDefault = "");
    			$$invalidate(9, fieldEdit = "");
    			$$invalidate(1, displayedData = await api.get(activeTable.replace(/ /g, "-"), token));
    			$$invalidate(0, dataTables = await api.get("database", token));
    			$$invalidate(2, headers = getHeaders(dataTables, activeTable));
    		} catch(err) {
    			console.log(err);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$4.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => $$invalidate(8, settingDefault = "");
    	const click_handler_1 = () => changeDefault(settingDefault.name, settingDefault._id);

    	function loggedin_1_currentUser_binding(value) {
    		currentUser = value;
    		$$invalidate(5, currentUser);
    	}

    	function loggedin_1_loggedin_binding(value) {
    		loggedin = value;
    		$$invalidate(4, loggedin);
    	}

    	function header_showAPIDocs_binding(value) {
    		showAPIDocs = value;
    		$$invalidate(6, showAPIDocs);
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

    	function table_fieldEdit_binding(value) {
    		fieldEdit = value;
    		$$invalidate(9, fieldEdit);
    	}

    	function table_settingDefault_binding(value) {
    		settingDefault = value;
    		$$invalidate(8, settingDefault);
    	}

    	function table_dataTables_binding(value) {
    		dataTables = value;
    		$$invalidate(0, dataTables);
    	}

    	function table_displayedData_binding(value) {
    		displayedData = value;
    		$$invalidate(1, displayedData);
    	}

    	function table_headers_binding(value) {
    		headers = value;
    		$$invalidate(2, headers);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		api,
    		getHeaders,
    		Header,
    		TableHeader,
    		camelcase,
    		LoggedIn,
    		ApiDocs,
    		Table,
    		dataTables,
    		displayedData,
    		headers,
    		activeTable,
    		loggedin,
    		currentUser,
    		showAPIDocs,
    		token,
    		settingDefault,
    		fieldEdit,
    		checkUser,
    		loadData,
    		newColHeader,
    		changeDefault
    	});

    	$$self.$inject_state = $$props => {
    		if ("dataTables" in $$props) $$invalidate(0, dataTables = $$props.dataTables);
    		if ("displayedData" in $$props) $$invalidate(1, displayedData = $$props.displayedData);
    		if ("headers" in $$props) $$invalidate(2, headers = $$props.headers);
    		if ("activeTable" in $$props) $$invalidate(3, activeTable = $$props.activeTable);
    		if ("loggedin" in $$props) $$invalidate(4, loggedin = $$props.loggedin);
    		if ("currentUser" in $$props) $$invalidate(5, currentUser = $$props.currentUser);
    		if ("showAPIDocs" in $$props) $$invalidate(6, showAPIDocs = $$props.showAPIDocs);
    		if ("token" in $$props) $$invalidate(7, token = $$props.token);
    		if ("settingDefault" in $$props) $$invalidate(8, settingDefault = $$props.settingDefault);
    		if ("fieldEdit" in $$props) $$invalidate(9, fieldEdit = $$props.fieldEdit);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		dataTables,
    		displayedData,
    		headers,
    		activeTable,
    		loggedin,
    		currentUser,
    		showAPIDocs,
    		token,
    		settingDefault,
    		fieldEdit,
    		checkUser,
    		loadData,
    		newColHeader,
    		changeDefault,
    		click_handler,
    		click_handler_1,
    		loggedin_1_currentUser_binding,
    		loggedin_1_loggedin_binding,
    		header_showAPIDocs_binding,
    		header_activeTable_binding,
    		header_headers_binding,
    		header_displayedData_binding,
    		table_fieldEdit_binding,
    		table_settingDefault_binding,
    		table_dataTables_binding,
    		table_displayedData_binding,
    		table_headers_binding
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    var app = new App({
    	target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
