% Copyright Robert Ryley 2016.  Released under LGPL License (v3).
% Revised 8/17/2016
%
% Cleanup and generalization of html parser program.
% Program description: Accept as input a file or URL, and extract
% specific components based on file extension (ie. PDF, jpeg, MP3, txt,
% etc), and save locally. User will have option to specify path and file
% name for each item, or accept default local file name, derived from
% component extension.
%
% Requirements: must be able to parse arbitrary HTML/XML and search for
% actual text element, or attribute, allow user to modify listing of
% data scraped and save results locally.
%
%   To start reading source, go to bottom of file to start procedure and
%   read in reverse order to this section.
%   To run program, at toplevel	enter '['path/to/scraper2.pl'].'
%   and	enter "start." at prompt.

:- use_module(library(http/http_open)).
:- use_module(library(sort)).
:- use_module(library(xpath)).
:- use_module(library(uri)).

% Unused for now, but useful for testing with query_tags/3 to extract
% different types of data manually at toplevel.
:- dynamic
	doc/1,
	data/1,
        text/1,
        relative/1,
	absolute/1,
	tags/1.

% Collect Tags maps visible text for link to URL attribute metadata. It
% presumes textual data and link data have been extracted with
% query_tag/3.  To test, type at toplevel:
% ? text(X), links(Y), collect_tags(X,Y,Z).

% Test data -- remove % to experiment. New lines stripped
% for testing when writing to file.

% text(['Google Search engine,','Amazon Shopping','Swi Prolog
% Website.','Clozure Common Lisp','SBCL Common Lisp','Webbots, Spiders,
% Screenscraper Website','Barebones PHP webscraper Docs']).

% links(['https://www.google.com',
% 'https://www.amazon.com','https://www.swi-prolog.org',
% 'https://www.clozure.com','https://wwww.cons.org',
% 'http://www.schrenk.com/nostarch/webbots/DSP_targets.php','https://barebonescms.com/documentation/ultimate_web_scraper_toolkit/']).


/* collect_tags([H1|Rest1],[H2|Rest2], Tags) :-  %assumes lists are of equal length. Not defined in other states.
	atomic_list_concat([H1,H2], " -- ",Out),
	append([Out], Tags),
	print(Out), nl,
	collect_tags(Rest1,Rest2, Tags).

Above prints out list in format I want, but I am not
able to pass data around correctly yet. Tags var remains uninstantiated
at end of recursion.

It appears I have to add an additional clause and variable and use a
tail recursive procedure, and unify the internal variable with my Tags
variable at the end.

Solution to try -- have collect_tags/3 call collect_tags/4 as in
collect_tags(List1,List2,[],Tags) and
collect_tags(List1,List2,Stack,Tags).

After first call, Arg 3 will have results pushed onto it as below and
will be a proper list. At termination, unify arg 3 with 4 to pass
results down stack.

Inspired by Prolog Programming in Depth, page 79 on list reversal.
*/

% Predicate collect_tags/3 assumes lists are of equal length. Not
% defined in other states.
%

collect_tags(List_1, List_2, Tags) :-  collect_tags_aux(List_1,List_2,[],Tags).

% Induction case:
collect_tags_aux([H1|Rest1],[H2|Rest2], Stack, Tags) :-  %Stack instantiated to [] (empty list) on first call
	atomic_list_concat([H1,H2], " -- ",New),	 % Takes element from each lists and makes new atom separated by "--".
	collect_tags_aux(Rest1,Rest2, [New|Stack], Tags). %Stack instantiated to empty list, with [New] as head.
							  %Later calls will push result to head of list.
							  %Tags remains uninstantiated until last call.

% Base case: When both lists are empty, [New|Stack] is unified with
% Tags. Tags has merged input lists and reversed their order.

collect_tags_aux([], [], Tags, Tags) :-
	reverse(Tags, Original),                   % Input lists will be reversed again to original order
        assert(tags(Original)),                    % Data stored in DB in original order
        write("Data stored in DB. Query tags(Var) to retrive.\n"),
	write_results(Original), nl.		   % All elements are printed to screen and procedure terminates.


% Filter predicates to separate relative (inbound) links from
% absolute (outbound) ones. Uses uri_components predicate from
% library(uri).	There are 3 possible cases to cover:
% Case 1: Absolute URL -- Scheme will be instantiated to http or https.
% This gets pushed to absolute url list.
% Case 2. Relative URL -- Scheme will be uninstantiated. Path will be
% instantiated.  This gets pushed to relative url list.
% Case 3: Scheme instantiated, but not to http or https. Simply ignore
% and call again with tail of list. May have to pass both relative and
% absolute lists throughout recursion.
% Case 4: Base Case -- URL List is empty.  Store results in DB.

test_url(URL_List, Absolute, Relative) :- test_url_aux(URL_List, [], [], Absolute, Relative), !.

% Case 1
test_url_aux([H|Rest], Abs_stack, Rel_stack, Absolute, Relative) :-
	uri_components(H, Components),
	Components =.. Component_list,
	Component_list = [_Functor, Scheme, _Authority, Path, _Search, _Fragment],
	nonvar(Scheme),
	nonvar(Path),
	http_or_https(Scheme),
	test_url_aux(Rest, [H|Abs_stack], Rel_stack, Absolute, Relative).

% Case 2
test_url_aux([H|Rest], Abs_stack, Rel_stack, Absolute, Relative) :-
	uri_components(H, Components),
	Components =.. Component_list,
	Component_list = [_Functor, Scheme, _Authority, _Path, _Search, _Fragment],
	var(Scheme),
	test_url_aux(Rest, Abs_stack, [H|Rel_stack], Absolute, Relative).

% Case 3
test_url_aux([H|Rest], Abs_stack, Rel_stack, Absolute, Relative) :-
	uri_components(H, Components),
	Components =.. Component_list,
	Component_list = [_Functor, Scheme, _Authority, _Path, _Search, _Fragment],
	nonvar(Scheme),
	\+ http_or_https(Scheme),
        test_url_aux(Rest, Abs_stack, Rel_stack, Absolute, Relative).

% Case 4
test_url_aux([],Absolute, Relative, Absolute, Relative) :-
	reverse(Absolute, Abs_original),
	reverse(Relative, Rel_original),
	assert(absolute(Abs_original)),
	assert(relative(Rel_original)),
	write("Query absolute(X) or relative(Y) to retrive result list.\n").

% Keep getting singlton warning or variable marked singleton appears
% more than once. May need to make custom predicate for URL Scheme to
% appear in.

http_or_https(X) :-
	X = http
	; X = https,
	true.

%% To test, run at toplevel:
%% get_local_file("test_input/cliki_index.htm").
%% query_tag(DOM, //div(1)/div(1)/div(2)/ul(3)/li/a(@href), Results),
%% test_url(Results, Absolute, Relative).

% 4/8/2016: Creates absolute URLs after extraction relative URL from
% page to be tested. Needs tail recursive procedure similar to
% collect_tags.
% 8/16/2016: For spider portion, need to test for relative vs absolute
% URL. I have not concluded whether using the regular expression
% library or using a custom DCG is best. I suspect the latter.

make_url(Domain, List, Links) :- make_url_aux(Domain, List, [], Links).

% Induction case: H is instantiated to first element of List, Stack is
% instantiated to empty list on first call. On subsequent calls, it will
% be a proper list. List is reduced by 1 item on each call.

make_url_aux(Domain, [H|List],Stack, Links) :-
	atomic_concat(Domain, H, Out),
	make_url_aux(Domain, List, [Out|Stack], Links).

% Base Case: Stack passed to Links via unification, with data in reverse
% order. Links variable is now empty. Reverse returns Links to original
% order. _Domain is not used and is anonymous variable.

make_url_aux(_Domain, [], Links, Links) :- reverse(Links, Original),
	write_results(Original), !.

/*  Write utility procedures for lists */

% write to standard output
write_results([H|Rest]) :-
	write(H),
	nl,
        write_results(Rest).

write_results([]) :-
	write('Done'),
	nl,
	!.

% write to file stream. Saves only the most recently asserted results.
write_results_to_file(Stream, [H|Rest]) :-
	write(Stream, H),
	write(Stream, "\n"),
        write_results_to_file(Stream, Rest).

write_results_to_file(Stream, []) :-
	write(Stream, "\n"), !.

/*   Query tag -- interface to Xpath

query_tag(help) :-  document arguments query tag takes.

query_tag(doc(DOM), <tag>, Results) :- find all tags in document that
unify with <tag>.

*/


query_tag(DOM, Tag, Results) :- doc(DOM),
	findall(Query, xpath(DOM, Tag, Query), Results).


query_tag(help) :- write("The predicate query_tag/3 returns portions of a previously parsed HTML/XML\n"),
	write("document specified by the first argument.  The proper format for a query tag is:\n"),
	write("     //tag -- returns all items matching that tag sequentially.\n"),
	write("     //tag(Int) -- returns specific tag or tags matching query.\n"),
	write("     //tag(@attribute) -- returns attributes of all tags.\n"),
	write("Examples: \n"),
	write("?- query_tag(DOM, //a(@href), Results). -> sequentially returns links.\n"),
	write("?- query_tag(DOM, //li(normalize_space), Results). -> text collected into list.\n"),
	write("?- query_tag(DOM, //li(4, text), Results). -> returns the text in the fourth element in a "),
	write("list.\n").

% File handling
get_local_file(File) :-
	open(File, read, Stream),
	load_html(Stream, DOM, [syntax_errors(quiet),
			        max_errors(-1)]),
	assert(doc(DOM)),   %might not need this.
	print(File), print(' stored in database. Query doc(Var) to retrieve.'),
	close(Stream).

get_url(URL, DOM) :-
	http_open(URL, In, []),
        call_cleanup(
            load_html(In, DOM, [syntax_errors(quiet),
			        max_errors(-1)]),
            close(In)).

% Correct now.  See notes below.
save_to_file(File_name, Term) :- %Term should be an instantiated list
	open(File_name, write, Data),
	write_results_to_file(Data, Term),
	close(Data).

% main procedures on start of program
start :-
	write("Use this program to extract data and metadata from webpages. For locally saved pages, use\n"),
	write("    get_local_file('/path/to/file').\n"),
	write("to load document. For remote page, use\n"),
	write("    get_url('http://path.to.doc.bla/more/paths/if/needed', DOM).\n"),
	write("File names and paths are single quoted strings. Arguments to predicates are\n"),
	write("separated by comma (,) and are terminated by period (.).\n"),
	write("To extract data, call 'query_tag(help).' for more info\n"),
	write("To save extracted data, do the following: \n"),
	write("?- data_1(List1), save_to_file('path/to/file', List1) \n").









